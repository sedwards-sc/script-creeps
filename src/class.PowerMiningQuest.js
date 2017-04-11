/* jshint esversion: 6 */

class PowerMiningQuest extends Quest {

	/**
	 *
	 */
	constructor(epic) {
		super('powerMining', epic);
	}

    initQuest() {
		let observer = this.room.findStructures(STRUCTURE_OBSERVER)[0];
        if(!observer) {
			return;
		}

		this.observeAndMonitor(observer);
		this.scanRoom();
	}

    collectCensus() {
		let max = 0;
		let prespawnTime = 1;
		if(this.memory.currentTarget) {
			max = 1;
			distance = Map.getRoomLinearDistance(this.epic.flag.pos.roomName, this.memory.currentTarget.pos.roomName) || 1;
			prespawnTime = distance * 25;
		}

		this.powerBankHealers = this.attendance("powerBankHealer", () => configBody({ MOVE: 25, HEAL: 25 }), max, { 'prespawn': prespawnTime, 'reservation': { 'spawns': 2, 'currentEnergy': 8000 } });

		this.powerBankAttackers = this.attendance("powerBankAttacker", () => configBody({ MOVE: 20, ATTACK: 20 }), this.powerBankHealers.length);

		let maxCollectors = 0;
		if(this.memory.currentTarget && this.memory.currentTarget.finishing === true) {
			collectorsRequired = Math.floor(this.memory.currentTarget.power / 1250);
			maxCollectors = Math.min(collectorsRequired, 4);
		}

		this.powerBankCollectors = this.attendance("powerBankCollector", () => configBody({ MOVE: 25, CARRY: 25 }), maxCollectors);
    }

    runActivities() {
    }

    questEnd() {
	}

    invalidateQuestCache() {
	}

	observeAndMonitor(observer) {
		if(this.memory.currentTarget) {
			observer.observeRoom(this.memory.currentTarget.pos.roomName);
		} else if(isArrayWithContents(this.epic.memory.powerMiningRooms)) {
			let roomList = this.epic.memory.powerMiningRooms;
			let observationIndex = Game.time % roomList.length;
			let roomToObserve = roomList[observationIndex];
			observer.observeRoom(roomToObserve);
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
					if(powerBank.hits < POWER_BANK_FINISHING_THRESHOLD) {
						this.memory.currentTarget.finishing = true;
					}
				} else {
					// analyze target
					if(powerBank.ticksToDecay > POWER_BANK_DECAY_THRESHOLD && powerBank.power > POWER_BANK_POWER_THRESHOLD && powerBank.hits === powerBank.hitsMax && observedRoom.findStructures(STRUCTURE_WALL).length === 0) {
						this.memory.currentTarget = {
							pos: powerBank.pos,
							hits: powerBank.hits,
							power: powerBank.power,
							//distance: Memory.powerObservers[this.room.name][room.name],
							timeout: Game.time + bank.ticksToDecay,
						};
					}
				}
			} else if(typeof this.memory.currentTarget !== 'undefined') {
				let powerPiles = getResourcesOfType(this.room.find(FIND_DROPPED_RESOURCES), RESOURCE_POWER);
				if(!isArrayWithContents(powerPiles)) {
					delete this.memory.currentTarget;
				}
			}
		}
	}

}

global.PowerMiningQuest = PowerMiningQuest;
