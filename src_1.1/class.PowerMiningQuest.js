/* jshint esversion: 6 */

class PowerMiningQuest extends Quest {

	/**
	 *
	 */
	constructor(epic) {
		super('powerMining', epic);
	}

    initQuest() {
		let observer = this.epic.flag.room.findStructures(STRUCTURE_OBSERVER)[0];
        if(!observer) {
			return;
		}

		this.scanRoom();
		this.observeAndMonitor(observer);
	}

    collectCensus() {
		let max = 0;
		let prespawnTime = 1;
		if(this.memory.currentTarget && !this.memory.currentTarget.collecting) {
			max = 1;
			let distance = Game.map.getRoomLinearDistance(this.epic.flag.pos.roomName, this.memory.currentTarget.pos.roomName) || 1;
			prespawnTime = distance * 25;
		}

		this.powerBankHealers = this.attendance("powerBankHealer", () => configBody({ move: 25, heal: 25 }), max, { 'prespawn': prespawnTime, 'reservation': { 'spawns': 2, 'currentEnergy': 8000 } });

		this.powerBankAttackers = this.attendance("powerBankAttacker", () => configBody({ move: 20, attack: 20 }), this.powerBankHealers.length);

		let maxCollectors = 0;
		if(this.memory.currentTarget && this.memory.currentTarget.finishing === true) {
			let collectorsRequired = Math.floor(this.memory.currentTarget.power / 1250);
			maxCollectors = Math.min(collectorsRequired, 4);
		}

		this.powerCollectors = this.attendance("powerCollector", () => configBody({ move: 25, carry: 25 }), maxCollectors);
    }

    runActivities() {
		for(let i = 0; i < 2; i++) {
            let powerBankAttacker = this.powerBankAttackers[i];
            if(powerBankAttacker) {
                if(!powerBankAttacker.memory.myHealerName) {
                    if(this.powerBankAttackers.length === this.powerBankHealers.length) {
                        powerBankAttacker.memory.myHealerName = this.powerBankHealers[i].name;
                    }
                } else {
                    this.powerBankAttackerActivities(powerBankAttacker);
                }
            }
            let powerBankHealer = this.powerBankHealers[i];
            if(powerBankHealer) {
                if(!powerBankHealer.memory.myAttackerName) {
                    if(this.powerBankAttackers.length === this.powerBankHealers.length) {
                        powerBankHealer.memory.myAttackerName = this.powerBankAttackers[i].name;
                    }
                } else {
                    this.powerBankHealerActivities(powerBankHealer);
                }
            }
        }

        if(this.powerCollectors) {
            let order = 0;
            for(let powerCollector of this.powerCollectors) {
                this.powerCollectorActivities(powerCollector, order);
                order++;
            }
        }
    }

    questEnd() {
	}

    invalidateQuestCache() {
	}

	powerBankAttackerActivities(attacker) {
        let myHealer = Game.creeps[attacker.memory.myHealerName];
        if(!myHealer || (!attacker.pos.isNearTo(myHealer) && !attacker.pos.isNearExit(1))) {
            attacker.idleOffRoad(this.epic.flag);
            return;
        }

        if(!this.memory.currentTarget) {
            this.log(`no current target, power mining team standing down (${attacker.room.name})`, 3);
            attacker.suicide();
            myHealer.suicide();
            return;
        }

        let bankPos = deserializeRoomPosition(this.memory.currentTarget.pos);

        if(attacker.pos.isNearTo(bankPos)) {
            attacker.memory.inPosition = true;
            let bank = bankPos.lookForStructure(STRUCTURE_POWER_BANK);
            if(bank) {
                if(bank.hits > 600 || attacker.ticksToLive < 5) {
                    attacker.attack(bank);
                } else {
                    // wait for collectors
                    for(let collector of this.powerCollectors) {
                        if(!bankPos.inRangeTo(collector, 5)) {
                            return;
                        }
                    }
                    attacker.attack(bank);
                }
            } else {
                // bank destroyed
                this.log(`power bank destroyed, power mining team standing down (${attacker.room.name})`, 3);
                this.memory.currentTarget.collecting = true;
                attacker.suicide();
                myHealer.suicide();
                return;
            }
        } else if(myHealer.fatigue === 0) {
            attacker.travelTo({ pos: bankPos}, {ignoreRoads: true});
        }
    }

	powerBankHealerActivities(healer) {
        let myAttacker = Game.creeps[healer.memory.myAttackerName];
        if(!myAttacker) {
            return;
        }

        if(myAttacker.ticksToLive === 1) {
            healer.suicide();
            return;
        }

        if(healer.pos.isNearTo(myAttacker)) {
            if(myAttacker.memory.inPosition) {
                healer.heal(myAttacker);
            } else {
                healer.move(healer.pos.getDirectionTo(myAttacker));
            }
        } else {
            healer.blindMoveTo(myAttacker);
        }
    }

	powerCollectorActivities(collector, order) {
        if(!collector.carry.power) {
            if(this.memory.currentTarget && this.memory.currentTarget.finishing && !this.memory.currentTarget.collecting) {
                this.powerCollectorApproachBank(collector, order);
                return;
            } else {
                if(this.memory.currentTarget && collector.pos.roomName !== this.memory.currentTarget.pos.roomName) {
                    collector.travelTo({ pos: deserializeRoomPosition(this.memory.currentTarget.pos) }, {ignoreRoads: true});
                    return;
                }
                let power = collector.room.find(FIND_DROPPED_RESOURCES, {
					filter: (r) => r.resourceType === RESOURCE_POWER
				})[0];
                if(power) {
                    if(collector.pos.isNearTo(power)) {
                        collector.pickup(power);
                        collector.blindMoveTo(this.epic.flag.room.storage);
                    } else {
                        collector.blindMoveTo(power);
                    }
                    return; //  early;
                }
            }

            //this.recycleCreep(collector);
			collector.suicide();
            return; // early
        }

        if(collector.pos.isNearTo(this.epic.flag.room.storage)) {
            collector.transfer(this.epic.flag.room.storage, RESOURCE_POWER);
        } else {
            // traveling to storage
            collector.travelTo(this.epic.flag.room.storage);
        }
    }

    powerCollectorApproachBank(collector, order) {
        let bankPos = deserializeRoomPosition(this.memory.currentTarget.pos);
        if(!collector.pos.inRangeTo(bankPos, 5)) {
            // traveling from spawn
            collector.travelTo({ pos: bankPos }, {ignoreRoads: true});
        } else {
            if(!collector.memory.inPosition) {
                if(bankPos.openAdjacentSpots().length > 0) {
                    if(collector.pos.isNearTo(bankPos)) {
                        collector.memory.inPosition = true;
                    } else {
                        collector.blindMoveTo(bankPos);
                    }
                } else if(order > 0) {
                    if(collector.pos.isNearTo(this.powerCollectors[order - 1])) {
                        collector.memory.inPosition = true;
                    } else {
                        collector.blindMoveTo(this.powerCollectors[order - 1]);
                    }
                } else {
                    if(collector.pos.isNearTo(this.powerBankAttackers[0])) {
                        collector.memory.inPosition = true;
                    } else {
                        collector.blindMoveTo(this.powerBankAttackers[0]);
                    }
                }
            }
        }
    }

	observeAndMonitor(observer) {
		let roomToObserve;
		if(this.memory.currentTarget) {
			roomToObserve = this.memory.currentTarget.pos.roomName;
		} else if(isArrayWithContents(this.epic.memory.powerMiningRooms)) {
			let roomList = this.epic.memory.powerMiningRooms;
			let observationIndex = Game.time % roomList.length;
			roomToObserve = roomList[observationIndex];
		}
		if(roomToObserve) {
			let obsReturn = observer.observeRoom(roomToObserve);
			if(obsReturn === OK) {
				this.log(`observing room ${roomToObserve}`, 0);
				this.memory.lastObservation = {
					'roomName': roomToObserve,
					'time': Game.time
				};
			} else {
				this.errorLog(`problem observing room ${roomToObserve}`, obsReturn, 5);
			}
		}
	}

	scanRoom() {
		if(this.memory.lastObservation && this.memory.lastObservation.time === Game.time - 1 && Game.rooms[this.memory.lastObservation.roomName]) {
			let observedRoom = Game.rooms[this.memory.lastObservation.roomName];
			let powerBank = observedRoom.findStructures(STRUCTURE_POWER_BANK)[0];
			if(powerBank) {
				if(this.memory.currentTarget) {
					// update current target
					this.memory.currentTarget.hits = powerBank.hits;
					if(powerBank.hits < POWER_BANK_FINISHING_THRESHOLD && !this.memory.currentTarget.finishing) {
						this.memory.currentTarget.finishing = true;
						this.log(`finishing power mining in room ${this.memory.currentTarget.pos.roomName}`, 5);
					}
				} else {
					if(this.epic.flag.room.storage.store.energy > POWER_MINING_STORAGE_THRESHOLD) {
						// analyze target
						if(powerBank.ticksToDecay > POWER_BANK_DECAY_THRESHOLD && powerBank.power > POWER_BANK_POWER_THRESHOLD && powerBank.hits === powerBank.hitsMax && observedRoom.findStructures(STRUCTURE_WALL).length === 0) {
							this.memory.currentTarget = {
								pos: powerBank.pos,
								hits: powerBank.hits,
								power: powerBank.power,
								//distance: Memory.powerObservers[this.room.name][room.name],
								timeout: Game.time + powerBank.ticksToDecay,
							};
							this.log(`new target chosen, room ${this.memory.currentTarget.pos.roomName} with ${this.memory.currentTarget.power} power`, 5);
						}
					}
				}
			} else if(typeof this.memory.currentTarget !== 'undefined') {
				let powerPiles = getResourcesOfType(observedRoom.find(FIND_DROPPED_RESOURCES), RESOURCE_POWER);
				if(!isArrayWithContents(powerPiles)) {
					this.log(`clearing target for room ${this.memory.currentTarget.pos.roomName}`, 5);
					delete this.memory.currentTarget;
				}
			}
		}
	}

}

global.PowerMiningQuest = PowerMiningQuest;
