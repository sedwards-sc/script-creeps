/* jshint esversion: 6 */
/*
 * prototype.creep.run
 */

Creep.prototype.run = function() {
	if(this.memory.role === 'miner') {
		this.runMiner2();
	} else if(this.memory.role === 'carrier') {
		this.runCarrier2();
	} else if(this.memory.role === 'harvester') {
		this.runHarvester2();
	} else if(this.memory.role === 'linker') {
		this.runLinker3();
	} else if(this.memory.role === 'builder') {
		this.runBuilder();
	} else if(this.memory.role === 'upgrader') {
		this.runUpgrader();
	} else if(this.memory.role === 'reinforcer') {
		this.runReinforcer();
    } else if(this.memory.role === 'mineralHarvester') {
        this.runMineralHarvester();
	} else if(this.memory.role === 'mineralCarrier') {
		this.runMineralCarrier();
	} else if(this.memory.role === 'defender') {
		this.runDefender();
	} else if(this.memory.role === 'remoteMiner') {
		this.runRemoteMiner2();
	} else if(this.memory.role === 'containerMiner') {
		this.runContainerMiner();
	} else if(this.memory.role === 'remoteCarrier') {
		this.runRemoteCarrier2();
	} else if(this.memory.role === 'reserver') {
		this.runReserver2();
	} else if(this.memory.role === 'claimer') {
		this.runClaimer2();
	} else if(this.memory.role === 'attackClaimer') {
		this.runAttackClaimer2();
	} else if(this.memory.role === 'explorer') {
		this.runExplorer();
	} else if(this.memory.role === 'remoteUpgrader') {
		this.runRemoteUpgrader();
	} else if(this.memory.role === 'remoteBuilder') {
		this.runRemoteBuilder2();
	} else if(this.memory.role === 'specialCarrier') {
		this.runSpecialCarrier();
	} else if(this.memory.role === 'dismantler') {
		this.runDismantler2();
	} else if(this.memory.role === 'medic') {
		this.runMedic();
	} else if(this.memory.role === 'scout') {
		this.runScout2();
	} else if(this.memory.role === 'soldier') {
		this.runSoldier();
	} else if(this.memory.role === 'powerBankAttacker') {
		this.runPowerBankAttacker();
	} else if(this.memory.role === 'powerCollector') {
		this.runPowerCollector();
	} else if(this.memory.role === 'powerCarrier') {
		this.runPowerCarrier();
	} else if(this.memory.role === 'remoteTransporter') {
		this.runRemoteTransporter();
    } else {
        this.errorLog('no role function', ERR_NOT_FOUND, 4);
    }
};

Creep.prototype.runMineralHarvester = function() {
	// state 0 is harvest
	// state 1 is transfer minerals

    var carrySum = _.sum(this.carry);

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if(carrySum === this.carryCapacity) {
		if(this.memory.state === 0) {
			this.say('I\'m full!');
		}
		this.memory.state = 1;
	}

    //TODO: make it so that it will work if other minerals or energy make it into this creeps baggage
    //have it empty everything into storage
	if(carrySum === 0) {
		if(this.memory.state === 1) {
			this.say('I\'m empty!');
		}
		this.memory.state = 0;
	}

	if(this.memory.state === 0) {
		// harvest
		var myMineral;
		if((this.memory.mineralId === undefined) || (this.memory.mineralType === undefined)) {
			myMineral = this.room.find(FIND_MINERALS)[0];
			this.memory.mineralId = myMineral.id;
			this.memory.mineralType = myMineral.mineralType;
		} else {
			myMineral = Game.getObjectById(this.memory.mineralId);
			if(myMineral === null) {
				delete this.memory.mineralId;
			}
		}
		if(this.harvest(myMineral) === ERR_NOT_IN_RANGE) {
			this.moveTo(myMineral);
		}
	} else {
		// transfer minerals to storage
		var roomStorage = this.room.storage;
		if(roomStorage) {
			if(this.transfer(roomStorage, this.memory.mineralType) === ERR_NOT_IN_RANGE) {
				this.moveTo(roomStorage);
			}
		}
	}
};

Creep.prototype.runCarrier = function () {
	//creep.say('carrier');
	// state 0 is get energy from storage
	// state 1 is transfer energy to structures

	if(this.pos.roomName !== this.memory.spawnRoom) {
		this.moveTo(new RoomPosition(25, 25, this.memory.spawnRoom));
		return;
	}

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if(this.carry.energy === this.carryCapacity) {
		if(this.memory.state === 0) {
			this.say('I\'m full!');
		}
		this.memory.state = 1;
	}

	if (this.carry.energy === 0) {
		if(this.memory.state === 1) {
			this.say('I\'m empty!');
		}
		this.memory.state = 0;
	}

	if(this.memory.state === 0) {
		if(this.room.terminal && (this.room.terminal.store.energy > this.room.terminal.getResourceQuota(RESOURCE_ENERGY))) {
			let excessEnergy = this.room.terminal.store.energy - this.room.terminal.getResourceQuota(RESOURCE_ENERGY);
			let transferAmount = Math.min(excessEnergy, this.carryCapacity);
			if(this.withdraw(this.room.terminal, RESOURCE_ENERGY, transferAmount) === ERR_NOT_IN_RANGE) {
				this.moveTo(this.room.terminal);
			}
		} else {
			// find storage
			let roomStorage = this.room.storage;
			if(this.withdraw(roomStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				this.moveTo(roomStorage);
			}
		}
	} else if(this.memory.state == 1) {
		// transfer energy to structures
		let closestTarget = this.getRefillTarget();

		if(closestTarget) {
			if(this.transfer(closestTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				this.moveTo(closestTarget);
			}
		} else {
			this.say('bored');
		}
	} else {
		this.memory.state = 0;
	}
};

Creep.prototype.runCarrier2 = function() {

	// let fleeing = paver.fleeHostiles();
	// if (fleeing) return; // early

	let withinRoom = this.pos.roomName === this.memory.spawnRoom;
	if(!withinRoom) {
		this.blindMoveTo(new RoomPosition(25, 25, this.memory.spawnRoom));
		return;
	}

	// I'm in the room
	let hasLoad = this.hasLoad();
	if(!hasLoad) {
		if(this.room.terminal && (this.room.terminal.store.energy > this.room.terminal.getResourceQuota(RESOURCE_ENERGY))) {
			let excessEnergy = this.room.terminal.store.energy - this.room.terminal.getResourceQuota(RESOURCE_ENERGY);
			let transferAmount = Math.min(excessEnergy, this.carryCapacity);
			if(this.withdraw(this.room.terminal, RESOURCE_ENERGY, transferAmount) === ERR_NOT_IN_RANGE) {
				this.blindMoveTo(this.room.terminal);
			}
		} else {
			if(this.withdraw(this.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				this.blindMoveTo(this.room.storage);
			}
		}
		return;
	}

	// I'm in the room and I have energy
	let findRoad = () => {
		return this.getRefillTarget();
	};
	let forget = (s) => s.energy === s.energyCapacity;
	let target = this.rememberStructure(findRoad, forget);
	if(!target) {
		this.say('bored');

		// need them to go to flag after refilling or theyll block the storage
		//this.memory.hasLoad = this.carry.energy === this.carryCapacity;

		// this.idleOffRoad(myFlag);
		// this.blindMoveTo(myFlag);
		return;
	}


	// and I have a target
	if(this.pos.isNearTo(target)) {
		this.transfer(target, RESOURCE_ENERGY);
	} else {
		this.blindMoveTo(target);
	}
};

Creep.prototype.runMiner = function() {
	//creep.say('miner');
	// state 0 is harvest
	// state 1 is transfer energy
	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if(this.carry.energy == this.carryCapacity) {
		if(this.memory.state === 0) {
			this.say('I\'m full!');
		}
		this.memory.state = 1;
	}

	if (this.carry.energy === 0) {
		if(this.memory.state == 1) {
			this.say('I\'m empty!');
		}
		this.memory.state = 0;
	}

	if(this.memory.state === 0) {
		// harvest
		var mySource;

		if(this.memory.mySourceId === undefined) {
			mySource = this.pos.findClosestByRange(FIND_SOURCES);
			this.memory.mySourceId = mySource.id;
		} else {
			mySource = Game.getObjectById(this.memory.mySourceId);
			if(mySource === null) {
				delete this.memory.mySourceId;
			}
		}

		if(mySource) {
			var harvestReturn = this.harvest(mySource);
			if (harvestReturn === ERR_NOT_IN_RANGE) {
				this.moveTo(mySource);
			} else if(harvestReturn === OK) {
				if((this.memory.spawnRoom === 'E9S27') && (this.pos.y !== 36) && (this.pos.y !== 35)) {
					this.move(TOP);
				}
			}
		}
	} else if(this.memory.state == 1) {
		// transfer to storage or drop
		var roomStorage = this.room.storage;
		if(roomStorage) {
			if(this.transfer(roomStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				this.moveTo(roomStorage);
			}
		} else {
			this.drop(RESOURCE_ENERGY);
		}
	} else {
		this.memory.state = 0;
	}
};

Creep.prototype.runMiner2 = function() {
	let myFlag;

    if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
    }

    if(this.pos.isEqualTo(myFlag)) {
        let mySource = Game.getObjectById(this.memory.mySourceId);
        if(mySource === null) {
            mySource = myFlag.pos.findClosestByRange(FIND_SOURCES);
            this.memory.mySourceId = mySource.id;
        }

        let harvestReturn = this.harvest(mySource);
        if(harvestReturn != OK) {
            this.errorLog('could not successfully harvest', harvestReturn, 4);
        }

        if(_.sum(this.carry) === this.carryCapacity) {
            let myTransferStructure = Game.getObjectById(this.memory.myTransferStructureId);
            if(myTransferStructure === null) {
                myTransferStructure = myFlag.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType === STRUCTURE_STORAGE) || (structure.structureType === STRUCTURE_LINK);
                        }
                });
                this.memory.myTransferStructureId = myTransferStructure.id;
            }

            let transferReturn = this.transfer(myTransferStructure, RESOURCE_ENERGY);
            if(transferReturn != OK) {
                this.errorLog('could not successfully transfer', transferReturn);
            }
        }

    } else {
        this.moveTo(myFlag);
    }
};

Creep.prototype.runLinker = function() {
	//creep.say('linker');
	// state 0 is get energy from link
	// state 1 is transfer energy to storage
	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if(this.carry.energy === this.carryCapacity) {
		if(this.memory.state === 0) {
			this.say('I\'m full!');
		}
		this.memory.state = 1;
	}

	if (this.carry.energy === 0) {
		if(this.memory.state == 1) {
			this.say('I\'m empty!');
		}
		this.memory.state = 0;
	}

	if(this.memory.state === 0) {
		// find link that isn't empty
		//var closestLink = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
		//		filter: (structure) => {
		//			return (structure.structureType === STRUCTURE_LINK) && (structure.energy >= creep.carryCapacity);
		//		}
		//});

		let closestLink = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_LINK}});

		// find storage link
		//var closestLink = Game.getObjectById('573a6ed5d32c966b71bd066b');

		if(!this.pos.isNearTo(closestLink)) {
			this.moveTo(closestLink);
		}
	} else if(this.memory.state === 1) {
		// transfer energy to storage
		let closestStorage = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
		if(this.transfer(closestStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
			this.moveTo(closestStorage);
		}
	} else {
		this.memory.state = 0;
	}
};

Creep.prototype.runLinker2 = function() {
	let myFlag;

    if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
    }

    if(this.pos.isEqualTo(myFlag)) {
		if(this.carry.energy > 0) {
			let roomStorage = this.room.storage;
			if(roomStorage) {
				let transferReturn = this.transfer(roomStorage, RESOURCE_ENERGY);
				if(transferReturn != OK) {
					console.log('!!!Error: ' + this.name + ' could not successfully transfer (' + transferReturn + ')');
				}
			}
		} else {

		}
    } else {
        this.moveTo(myFlag);
    }
};

Creep.prototype.runLinker3 = function() {
	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
	        return;
		}
    }

    if(this.pos.isEqualTo(myFlag)) {
		if(_.sum(this.carry) > 0) {
			let highestQuantityResourceType = this.getHighestQuantityResourceType();
			let transferTarget;

			let roomTerminal = this.room.terminal;
			if(roomTerminal) {
				if(undefToZero(roomTerminal.store[highestQuantityResourceType]) < roomTerminal.getResourceQuota(highestQuantityResourceType)) {
					transferTarget = roomTerminal;
				}
			}

			let roomStorage = this.room.storage;
			if(roomStorage) {
				if((highestQuantityResourceType === RESOURCE_ENERGY) && (roomStorage.store.energy < 10000)) {
					transferTarget = roomStorage;
				}
				if(!transferTarget) {
					transferTarget = roomStorage;
				}
			}


			if(transferTarget) {
				let transferReturn = this.transfer(transferTarget, highestQuantityResourceType);
				if(transferReturn != OK) {
					this.errorLog('could not successfully transfer', transferReturn, 4);
				}
			}
		} else {
			let myLink = Game.getObjectById(this.memory.myLinkId);
	        if(myLink === null) {
	            myLink = myFlag.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_LINK}});
	            this.memory.myLinkId = myLink.id;
	        }

			if(!myLink) {
				this.errorLog('could not find link', ERR_NOT_FOUND, 4);
				return;
			}

			if(myLink.energy > 0) {
				this.withdraw(myLink, RESOURCE_ENERGY);
			} else if(this.room.terminal && (undefToZero(this.room.terminal.store.energy) > this.room.terminal.getResourceQuota(RESOURCE_ENERGY))) {
				// TODO: upgrade to have linkers remove excess of other resource types as well
				let excessEnergy = this.room.terminal.store.energy - this.room.terminal.getResourceQuota(RESOURCE_ENERGY);
				let withdrawEnergy = Math.min(this.carryCapacity, excessEnergy);
				this.withdraw(this.room.terminal, RESOURCE_ENERGY, withdrawEnergy);
			} else {
				if(this.room.storage && this.room.terminal) {
					for(let curResourceType in this.room.storage.store) {
						if((this.room.storage.store[curResourceType] > 0) && (undefToZero(this.room.terminal.store[curResourceType]) < this.room.terminal.getResourceQuota(curResourceType))) {
							if(this.withdraw(this.room.storage, curResourceType) === OK) {
								break;
							}
						}
					}
				}
			}
		}
    } else {
        this.moveTo(myFlag);
    }
};

Creep.prototype.runHarvester = function() {
	// state 0 is harvest
	// state 1 is transfer energy
	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if(this.carry.energy === this.carryCapacity) {
		if(this.memory.state === 0) {
			this.say('I\'m full!');
		}
		this.memory.state = 1;
	}

	if(this.carry.energy === 0) {
		if(this.memory.state == 1) {
			this.say('I\'m empty!');
		}
		this.memory.state = 0;
	}

	if(this.memory.state === 0) {
		// harvest
		// TODO: find closest source
		//var source = creep.pos.findClosestByPath
		//var sources = creep.room.find(FIND_SOURCES);
		//if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
		//    creep.moveTo(sources[0]);
		//}

		// harvest
		var mySource;
		if(this.memory.hMine === undefined) {
			mySource = this.pos.findClosestByRange(FIND_SOURCES);
		} else {
			mySource = this.room.find(FIND_SOURCES)[this.memory.hMine];
		}
		if(this.harvest(mySource) === ERR_NOT_IN_RANGE) {
			this.moveTo(mySource);
		}
	} else {
		// transfer energy

		var closestTarget;

		// if room energy is < 300, fill extensions first so spawn can generate energy
		if(this.room.energyAvailable < 300) {
			closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType === STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity;
					}
			});

			if(!closestTarget) {
				closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
						filter: (structure) => {
							return (structure.structureType === STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
						}
				});
			}
		} else {
			closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType === STRUCTURE_EXTENSION ||
								structure.structureType === STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
					}
			});
		}

		if(!closestTarget) {
			closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType === STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
					}
			});
		}

		if(closestTarget) {
			if(this.transfer(closestTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				this.moveTo(closestTarget);
			}
		} else {
			// build
			var targets = this.room.find(FIND_CONSTRUCTION_SITES);
			if(targets.length) {
				if(this.build(targets[0]) == ERR_NOT_IN_RANGE) {
					this.moveTo(targets[0]);
				}
			} else {
				//else transfer to storage
				//var closestStorage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
				//if(creep.transfer(closestStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				//    creep.moveTo(closestStorage);
				//}

				// else upgrade
				if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
					this.moveTo(this.room.controller);
				}
			}
		}
	}
};

Creep.prototype.runHarvester2 = function() {
	// state 0 is harvest
	// state 1 is transfer energy

	if(this.pos.roomName !== this.memory.spawnRoom) {
		this.moveTo(new RoomPosition(25, 25, this.memory.spawnRoom));
		return;
	}

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if(this.carry.energy === this.carryCapacity) {
		if(this.memory.state === 0) {
			this.say('I\'m full!');
		}
		this.memory.state = 1;
	}

	if(this.carry.energy === 0) {
		if(this.memory.state == 1) {
			this.say('I\'m empty!');
		}
		this.memory.state = 0;
	}

	if(this.memory.state === 0) {
		// harvest
		let mySource = Game.getObjectById(this.memory.mySourceId);
        if(mySource === null) {
			let myFlag;

		    if(this.memory.flagName === undefined) {
		        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
		        return;
		    } else {
		        myFlag = Game.flags[this.memory.flagName];
				if(!myFlag) {
					this.errorLog('flag is missing', ERR_NOT_FOUND);
					return;
				}
		    }

			// TODO: assuming lookForAt is cheaper, change to use that instead of findClosestByRange for the source
            mySource = myFlag.pos.findClosestByRange(FIND_SOURCES);
            this.memory.mySourceId = mySource.id;
        }

		if(this.harvest(mySource) === ERR_NOT_IN_RANGE) {
			this.moveTo(mySource);
		}
	} else {
		// transfer energy
		// TODO: cache targets in memory. check if null or full each tick
		var closestTarget;

		// if room energy is < 300, fill extensions first so spawn can generate energy
		if(this.room.energyAvailable < 300) {
			closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType === STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity;
					}
			});

			if(!closestTarget) {
				closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
						filter: (structure) => {
							return (structure.structureType === STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
						}
				});
			}
		} else {
			closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType === STRUCTURE_EXTENSION ||
								structure.structureType === STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
					}
			});
		}

		if(!closestTarget) {
			closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType === STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
					}
			});
		}

		if(closestTarget) {
			if(this.transfer(closestTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				this.moveTo(closestTarget);
			}
		} else {
			// build
			var targets = this.room.find(FIND_CONSTRUCTION_SITES);
			if(targets.length) {
				if(this.build(targets[0]) == ERR_NOT_IN_RANGE) {
					this.moveTo(targets[0]);
				}
			} else {
				//else transfer to storage
				//var closestStorage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
				//if(creep.transfer(closestStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				//    creep.moveTo(closestStorage);
				//}

				// else upgrade
				if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
					this.moveTo(this.room.controller);
				}
			}
		}
	}
};

Creep.prototype.runSpecialCarrier = function () {
	this.say('SC');
	// state 0 is get energy from pickup storage
	// state 1 is transfer energy to drop off storage
	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if(_.sum(this.carry) === this.carryCapacity) {
		if(this.memory.state === 0) {
			this.say('I\'m full!');
		}
		this.memory.state = 1;
	}

	if (_.sum(this.carry) === 0) {
		if(this.memory.state === 1) {
			this.say('I\'m empty!');
		}
		this.memory.state = 0;
	}

	if(this.memory.state === 0) {
		// go to pick up storage
		let pickUpStorage = Game.getObjectById('5737ae2c1c63804f2a51e480');
		//for(let resource in pickUpStorage.store) {
		//	console.log('--' + resource + ' = ' + pickUpStorage.store[resource]);
		//}
		if(this.pos.isNearTo(pickUpStorage)) {
			let minResourceType = 'energy';
			for(let resource in pickUpStorage.store) {
				if((pickUpStorage.store[resource] > 0) && (pickUpStorage.store[resource] <= pickUpStorage.store[minResourceType])) {
					minResourceType = resource;
				}
			}
			this.takeResource(pickUpStorage, minResourceType);
		} else {
			this.moveTo(pickUpStorage);
		}
	} else if(this.memory.state == 1) {
		// go to drop off storage
		let dropOffStorage = Game.getObjectById('57c672a3bd87d4c163315dc6');
		if(this.pos.isNearTo(dropOffStorage)) {
			let minResourceType = 'energy';
			for(let resource in dropOffStorage.store) {
				if((dropOffStorage.store[resource] > 0) && (dropOffStorage.store[resource] <= dropOffStorage.store[minResourceType])) {
					minResourceType = resource;
				}
			}
			this.transfer(dropOffStorage, minResourceType);
		} else {
			this.moveTo(dropOffStorage);
		}
	} else {
		this.memory.state = 0;
	}
};

Creep.prototype.runDismantler = function() {
    let attackRoom = this.memory.attackRoom;
    if(attackRoom === undefined) {
        console.log('!!!Error: ' + this.name + ' has no attack room in memory!!!');
        return;
    }

    if(this.pos.roomName === attackRoom) {
		let goal;

		let hostileSpawns = this.room.find(FIND_HOSTILE_STRUCTURES, {
				filter: (structure) => {
					return structure.structureType === STRUCTURE_SPAWN;
				}
		});

		if(hostileSpawns.length > 0) {
			goal = { pos: hostileSpawns[0].pos, range: 0 };
		}

		if(goal === undefined) {
			let hostileTowers = this.room.find(FIND_HOSTILE_STRUCTURES, {
					filter: (structure) => {
						return structure.structureType === STRUCTURE_TOWER;
					}
			});

			if(hostileTowers.length > 0) {
				goal = { pos: hostileTowers[0].pos, range: 0 };
			}
		}

		if(goal === undefined) {
			console.log('***Finished: ' + this.name + ' has no more attack targets***');
			return;
		}

		let pathToTarget = PathFinder.search(this.pos, goal, {
			plainCost: 2,
			swampCost: 10,

			roomCallback: function(roomName) {

				let room = Game.rooms[roomName];
				if (!room) return;
				let costs = new PathFinder.CostMatrix();

				room.find(FIND_STRUCTURES).forEach(function(structure) {
					if (structure.structureType === STRUCTURE_ROAD) {
						// Favor roads over plain tiles
						costs.set(structure.pos.x, structure.pos.y, 1);
					} else if ((structure.structureType !== STRUCTURE_CONTAINER) && (structure.structureType !== STRUCTURE_RAMPART) && (structure.structureType !== STRUCTURE_WALL) && (structure.structureType !== STRUCTURE_SPAWN) && (structure.structureType !== STRUCTURE_TOWER)) {
						costs.set(structure.pos.x, structure.pos.y, 0xff);
					}
				});

				// Avoid creeps in the room
				room.find(FIND_CREEPS).forEach(function(creep) {
					costs.set(creep.pos.x, creep.pos.y, 0xff);
				});

				return costs;
			},
		});

		if(!pathToTarget) {
			console.log('!!!Error: ' + this.name + ' has no path to target!!!');
		}

		let nextPos = pathToTarget.path[0];

		let foundStructures = this.room.lookForAt(LOOK_STRUCTURES, nextPos);

		if(foundStructures.length && !foundStructures[0].my) {
			this.dismantle(foundStructures[0]);
		} else {
			this.moveTo(nextPos);
		}

	} else {
		let attackRoomPosition = new RoomPosition(25, 25, attackRoom);
		this.moveTo(attackRoomPosition);
	}
};

Creep.prototype.runDismantler2 = function() {
	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
	        return;
		}
    }

	if(myFlag.memory.dismantler && isArrayWithContents(myFlag.memory.dismantler.boosts)) {
		this.memory.boostedArray = this.memory.boostedArray || [];
        for(let i in myFlag.memory.dismantler.boosts) {
			if(this.memory.boostedArray[i] !== true) {
	            let boostObj = myFlag.memory.dismantler.boosts[i];
				let boostReturn = this.getBoosted(boostObj.part, boostObj.resource);
	    		if(boostReturn === OK) {
	    			this.memory.boostedArray[i] = true;
	    		} else {
					return;
				}
			}
        }
	}

    if(this.pos.roomName === myFlag.pos.roomName) {
		let goal;

		let foundFlagStructures = this.room.lookForAt(LOOK_STRUCTURES, myFlag.pos);

		if(foundFlagStructures.length && !foundFlagStructures[0].my) {
			goal = foundFlagStructures[0];
		}

		if(goal === undefined) {
			let hostileTowers = this.room.find(FIND_HOSTILE_STRUCTURES, {
					filter: (structure) => {
						return structure.structureType === STRUCTURE_TOWER;
					}
			});

			if(hostileTowers.length > 0) {
				goal = { pos: hostileTowers[0].pos, range: 0 };
			}
		}

		if(typeof goal === 'undefined') {
			let hostileSpawns = this.room.find(FIND_HOSTILE_STRUCTURES, {
					filter: (structure) => {
						return structure.structureType === STRUCTURE_SPAWN;
					}
			});

			if(hostileSpawns.length > 0) {
				goal = { pos: hostileSpawns[0].pos, range: 0 };
			}
		}

        if(myFlag.memory.destroyAll === true) {
		    if(typeof goal === 'undefined') {
    			let notMyStructures = this.room.find(FIND_STRUCTURES, {
    					filter: (structure) => {
    						return (structure.my !== true && structure.hits > 0);
    					}
    			});

    			if(notMyStructures.length > 0) {
    				goal = { pos: notMyStructures[0].pos, range: 0 };
    			}
    		}
		} else if(myFlag.memory.destroyWalls === true) {
		    if(typeof goal === 'undefined') {
    			let walls = this.room.find(FIND_STRUCTURES, {
    					filter: (structure) => {
    						return structure.structureType === STRUCTURE_WALL;
    					}
    			});

    			if(walls.length > 0) {
    				goal = { pos: walls[0].pos, range: 0 };
    			}
    		}
		}

		if(goal === undefined) {
			this.log('no more attack targets', 3);
			this.moveTo(myFlag);
			return;
		}

		let pathToTarget = PathFinder.search(this.pos, goal, {
			plainCost: 2,
			swampCost: 10,

			roomCallback: function(roomName) {

				let room = Game.rooms[roomName];
				if (!room) return;
				let costs = new PathFinder.CostMatrix();

				room.find(FIND_STRUCTURES).forEach(function(structure) {
					if (structure.pos.isEqualTo(goal.pos)) {
				        // goal should always be walkable to dismantle it
				        costs.set(structure.pos.x, structure.pos.y, 1);
				    } else if (structure.structureType === STRUCTURE_ROAD) {
						// Favor roads over plain tiles
						//costs.set(structure.pos.x, structure.pos.y, 1);
						// roads will be dismantled anyway so set to the same as plains
						costs.set(structure.pos.x, structure.pos.y, 2);
					} else if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) {
						let tileCost = 251;

						if(structure.hits <= 10000000) {
							//NewValue = (((OldValue - OldMin) * (NewMax - NewMin)) / (OldMax - OldMin)) + NewMin
							//OldRange = (OldMax - OldMin)
							//NewRange = (NewMax - NewMin)
							//NewValue = (((OldValue - OldMin) * NewRange) / OldRange) + NewMin

							tileCost = Math.round((((structure.hits) * 235) / 10000000) + 15);
						}

						costs.set(structure.pos.x, structure.pos.y, tileCost);
					} else if ((structure.structureType !== STRUCTURE_CONTAINER) && (structure.structureType !== STRUCTURE_RAMPART) && (structure.structureType !== STRUCTURE_WALL) && (structure.structureType !== STRUCTURE_SPAWN) && (structure.structureType !== STRUCTURE_TOWER) && (structure.structureType !== goal.structureType)) {
						costs.set(structure.pos.x, structure.pos.y, 0xff);
					}
				});

				// Avoid creeps in the room
				room.find(FIND_CREEPS).forEach(function(creep) {
					costs.set(creep.pos.x, creep.pos.y, 0xff);
				});

				return costs;
			},
		});

		if(!pathToTarget) {
			this.errorLog('no path to target', ERR_NO_PATH, 4);
		}

		let nextPos = pathToTarget.path[0];

		let foundStructures = this.room.lookForAt(LOOK_STRUCTURES, nextPos);

		if(foundStructures.length && !foundStructures[0].my) {
			this.dismantle(foundStructures[0]);
		} else {
			if((Game.time % 3) !== 0) {
				return;
			}
			this.moveTo(nextPos);
		}

	} else {
		this.moveTo(myFlag);
	}
};

Creep.prototype.runMedic = function() {
	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
	        return;
		}
    }

	if(myFlag.memory.medic && isArrayWithContents(myFlag.memory.medic.boosts)) {
		this.memory.boostedArray = this.memory.boostedArray || [];
        for(let i in myFlag.memory.medic.boosts) {
			if(this.memory.boostedArray[i] !== true) {
	            let boostObj = myFlag.memory.medic.boosts[i];
				let boostReturn = this.getBoosted(boostObj.part, boostObj.resource);
	    		if(boostReturn === OK) {
	    			this.memory.boostedArray[i] = true;
	    		} else {
					return;
				}
			}
        }
	}

	let creepLeader = Game.creeps[this.memory.leader];

	if(!creepLeader) {
		let creepLeaders = _.filter(Game.creeps,
				(creep) => {
					return ((creep.memory.flagName === this.memory.flagName) && ((creep.memory.role === 'dismantler') || (creep.memory.role === 'powerBankAttacker')));
				}
		);

		if(creepLeaders.length > 0) {
			creepLeader = creepLeaders[0];
			this.memory.leader = creepLeader.name;
		} else {
			this.log('could not find leader');
			// TODO: flee from room if hostile
			return;
		}
	}

	if(!this.pos.isNearTo(creepLeader)) {
		this.moveTo(creepLeader);
	}

	if(creepLeader.memory.role === 'powerBankAttacker') {
	    if(creepLeader.hits < creepLeader.hitsMax) {
	        let rangeToLeader = this.pos.getRangeTo(creepLeader);

	        if(rangeToLeader <= 3) {
	            let healReturn = this.heal(creepLeader);
	            if(healReturn === ERR_NOT_IN_RANGE) {
        			healReturn = this.rangedHeal(creepLeader);
        		}
        		if(healReturn === OK) {
    			    return;
    			}
	        }
	    }
	}

	let hurtSameRoomCreeps = this.room.find(FIND_MY_CREEPS, {
			filter: (creep) => {
				return creep.hits < creep.hitsMax;
			}
	});

	let inRangeHurtCreeps = this.pos.findInRange(hurtSameRoomCreeps, 3);
 	let sortedInRangeHurtCreeps = _.sortBy(inRangeHurtCreeps, function(creep) { return creep.hits; });

	if(sortedInRangeHurtCreeps.length > 0) {
		if(this.heal(sortedInRangeHurtCreeps[0]) !== OK) {
			this.rangedHeal(sortedInRangeHurtCreeps[0]);
		}
	}
};

Creep.prototype.runScout = function() {
    this.say('scout');

	let myFlag;

    if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
	        return;
		}
    }

	// TODO: cache this
	let destinationRoom = /_remote_([EW]\d+[NS]\d+)_/.exec(myFlag.name)[1];

	if(this.room.name === destinationRoom) {
		if(!this.pos.isEqualTo(myFlag)) {
			this.moveTo(myFlag);
		}
	} else {
		let destinationRoomPosition = new RoomPosition(25, 25, destinationRoom);
		this.moveTo(destinationRoomPosition, {
            costCallback: function(roomName, costMatrix) {
        	    if(roomName === 'E7S37') {
        		    for(i = 0; i < 50; i++) {
        		        for(j = 0; j < 50; j++) {
        		            costMatrix.set(i, j, 0xff);
        		        }
        		    }
        		}
        	}
        });
	}
};

Creep.prototype.runScout2 = function() {
    this.say('scout');

	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 5);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND, 4);
			// start suicide
			this.memory.suicideCounter = this.memory.suicideCounter || 5;
			if(this.memory.suicideCounter === 4) {
			    countAllCreepFlags();
			} else if(this.memory.suicideCounter <= 1) {
			    delete Memory.creeps[this.name].suicideCounter;
				this.suicide();
			}
			if(typeof this.memory.suicideCounter !== 'undefined') {
			    this.memory.suicideCounter--;
			}
	        return;
		}
    }

	if(!this.pos.isEqualTo(myFlag)) {
		let travelReturn = this.travelTo(myFlag, { 'useFindRoute': true });
		if(travelReturn !== OK) {
			this.errorLog('problem travelling to flag', travelReturn, 4);
		}
	} else {
		if(typeof myFlag.memory.signMessage === 'string') {
			let signReturn = this.signController(this.room.controller, myFlag.memory.signMessage);
			if(signReturn !== OK) {
				this.errorLog('could not successfully sign controller', signReturn, 4);
			}
		}
	}
};

Creep.prototype.runSoldier = function() {
	let myFlag;

    if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
		if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
	        return;
		}
    }

	// TODO: cache this
	let destinationRoom = /_remote_([EW]\d+[NS]\d+)_/.exec(myFlag.name)[1];

	if(this.room.name === destinationRoom) {
		let target = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
		if(target) {
			if(this.attack(target) === ERR_NOT_IN_RANGE) {
				this.moveTo(target);
			}
		} else {
			if(!this.pos.isEqualTo(myFlag)) {
				this.moveTo(myFlag);
			}
		}
	} else {
		let destinationRoomPosition = new RoomPosition(25, 25, destinationRoom);
		this.moveTo(destinationRoomPosition);
	}
};

Creep.prototype.runRemoteMiner = function() {
	//creep.say('rMiner');
	// state 0 is head to next room
	// state 1 harvest

	if((this.memory.rRoomName === undefined) || (this.memory.rX === undefined) || (this.memory.rY === undefined)) {
		return;
	}

	//var checkPointAway = new RoomPosition(48, 31, 'E7S23');

	var checkPointAway = new RoomPosition(this.memory.rX, this.memory.rY, this.memory.rRoomName);

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if((this.memory.state === 0) && (JSON.stringify(this.pos) === JSON.stringify(checkPointAway))) {
		this.say('away pt');
		this.memory.state = 1;
	}


	if(this.memory.state === 0) {
		this.moveTo(checkPointAway);
	} else if(this.memory.state === 1) {
		// harvest
		var mySource;
		if(this.memory.remoteMine === undefined) {
			mySource = this.pos.findClosestByPath(FIND_SOURCES);
		} else {
			mySource = this.room.find(FIND_SOURCES)[this.memory.remoteMine];
		}
		if(this.harvest(mySource) === ERR_NOT_IN_RANGE) {
			this.moveTo(mySource);
		}
	}
};

Creep.prototype.runRemoteMiner2 = function() {
	if((Game.time % 50) === 1) {
		let reqParts = _.filter(this.body, function(bodyPart) { return (bodyPart.type === WORK) && (bodyPart.hits > 0); });

		if(typeof reqParts === 'undefined' || reqParts.length === 0) {
	        this.errorLog('missing required body parts; attempting suicide', ERR_NO_BODYPART, 4);
			this.suicide();
	    }
	}

	let myFlag;

    if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
		if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
	        return;
		}
    }

    if(this.pos.isEqualTo(myFlag)) {
        let mySource = Game.getObjectById(this.memory.mySourceId);
        if(mySource === null) {
            mySource = myFlag.pos.findClosestByRange(FIND_SOURCES);
            this.memory.mySourceId = mySource.id;
        }

        let harvestReturn = this.harvest(mySource);
        if(harvestReturn != OK) {
            this.errorLog('could not successfully harvest', harvestReturn, 4);
        }
    } else {
        this.moveTo(myFlag);
    }
};

Creep.prototype.runContainerMiner = function() {
	if((Game.time % 50) === 1) {
		let reqParts = _.filter(this.body, function(bodyPart) { return (bodyPart.type === WORK) && (bodyPart.hits > 0); });

		if(typeof reqParts === 'undefined' || reqParts.length === 0) {
	        this.errorLog('missing required body parts; attempting suicide', ERR_NO_BODYPART, 4);
			this.suicide();
	    }
	}

	let flagLoaded = this.loadFlag();
	if(!flagLoaded) {
		return;
	}

	// flag is loaded

	if(!this.pos.isEqualTo(this.myFlag)) {
		this.blindMoveTo(this.myFlag);
		return;
	}

	// in position on flag

	let findSource = () => {
		// TODO: do a range 1 search instead of closest and then checking correct range
		let potentialSource = this.myFlag.pos.findClosestByRange(FIND_SOURCES);
		if(this.myFlag.pos.isNearTo(potentialSource)) {
			return potentialSource;
		}
	};
	let forgetSource = (s) => {
		return this.myFlag.pos.getRangeTo(s) > 1;
	};
	let source = this.rememberStructure(findSource, forgetSource, 'sourceStructureId', true);
	if(!source) {
		this.errorLog('flag not correctly placed within range of a source', ERR_NOT_IN_RANGE, 4);
		return;
	}

	// have successfully cached a source

	let findContainer = () => {
		return this.myFlag.pos.lookForStructure(STRUCTURE_CONTAINER);
	};
	let forgetContainer = (s) => {
		return this.myFlag.pos.getRangeTo(s) > 1;
	};
	let container = this.rememberStructure(findContainer, forgetContainer, 'containerStructureId', true);
	if(!container) {
		let findConstructionSite = () => {
			let constructionSites = this.myFlag.pos.lookFor(LOOK_CONSTRUCTION_SITES);
			return _.find(constructionSites, {structureType: STRUCTURE_CONTAINER});
		};
		let forgetConstructionSite = (s) => {
			return s.progress === s.progressTotal;
		};
		let constructionSite = this.rememberStructure(findConstructionSite, forgetConstructionSite, 'constructionSiteId', true);
		if(!constructionSite) {
			// place construction site
			this.myFlag.pos.createConstructionSite(STRUCTURE_CONTAINER);
			return;
		}

		// have successfully cached construction site for the container

		let hasLoad = this.hasLoad();
		if(!hasLoad) {
			this.harvest(source);
			return;
		}

		// have energy for building

		this.build(constructionSite);
		return;
	}

	// have successfully cached container

	if(source.energy > 0) {
		this.harvest(source);
	} else {
		if(container.hits < container.hitsMax) {
			this.repair(container);
		}
	}
};

Creep.prototype.runRemoteCarrier = function() {
	//creep.say('rCarrier');
	// state 0 is head to next room
	// state 1 harvest
	// state 2 is head back to home room
	// state 3 is upgrade controller

	if((this.memory.rRoomName === undefined) || (this.memory.rX === undefined) || (this.memory.rY === undefined)) {
		return;
	}

	if((this.memory.hRoomName === undefined) || (this.memory.hX === undefined) || (this.memory.hY === undefined)) {
		return;
	}

	var checkPointAway = new RoomPosition(this.memory.rX, this.memory.rY, this.memory.rRoomName);
	var checkPointHome = new RoomPosition(this.memory.hX, this.memory.hY, this.memory.hRoomName);

	//if(this.memory.positionState === undefined) {
	//	this.memory.positionState = 0;
	//}

	//var checkPointHome = new RoomPosition(13, 11, 'E8S23');
	//var checkPointHome = new RoomPosition(2, 25, 'E8S23');
	//var checkPointAway = new RoomPosition(48, 32, 'E7S23');

	//if(this.memory.positionState === 0) {
	//	checkPointAway = new RoomPosition(45, 28, 'E7S23');
	//} else {
	//	checkPointAway = new RoomPosition(48, 34, 'E7S23');
	//}

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if((this.memory.state === 0) && (JSON.stringify(this.pos) === JSON.stringify(checkPointAway))) {
		this.say('away pt');
		this.memory.state = 1;
	}

	if((this.memory.state === 1) && (this.carry.energy === this.carryCapacity)) {
		this.say('full');
		this.memory.state = 2;
	}

	if((this.memory.state === 2) && (JSON.stringify(this.pos) === JSON.stringify(checkPointHome))) {
		this.say('home pt');
		this.memory.state = 3;
	}

	if ((this.memory.state === 3) && (this.carry.energy === 0)) {
		this.say('empty');
		this.memory.state = 0;
		//if(this.memory.positionState === 0) {
		//	this.memory.positionState = 1;
		//} else if(this.memory.positionState === 1) {
		//	this.memory.positionState = 0;
		//}
	}


	if(this.memory.state === 0) {
		this.moveTo(checkPointAway);
	} else if(this.memory.state === 1) {
		// harvest
		var closestEnergy = this.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
				filter: (pile) => {
					return pile.energy >= this.carryCapacity;
				}
		});

		if(this.pickup(closestEnergy) === ERR_NOT_IN_RANGE) {
			this.moveTo(closestEnergy);
		}
	} else if(this.memory.state === 2) {
		this.moveTo(checkPointHome);
	} else if(this.memory.state === 3) {
		// transfer to link if there is one that isn't full
		var closestLink = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType === STRUCTURE_LINK) && (structure.energy < (structure.energyCapacity * 0.95));
				}
		});

		if(closestLink) {
			if(this.transfer(closestLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				this.moveTo(closestLink);
			}
		} else {
			//drop energy
			this.drop(RESOURCE_ENERGY);
		}
	}
};

Creep.prototype.runRemoteCarrier2 = function() {
	//creep.say('rCarrier');
	// state 0 is head to next room
	// state 1 harvest
	// state 2 is head back to home room
	// state 3 is upgrade controller

	let myFlag;

    if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
		if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
	        return;
		}
    }

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if((this.memory.state === 0) && (this.pos.isEqualTo(myFlag))) {
		this.say('away pt');
		this.memory.state = 1;
	}

	if((this.memory.state === 1) && (this.carry.energy === this.carryCapacity)) {
		this.say('full');
		this.memory.state = 2;
	}

	if((this.memory.state === 2) && (this.room.name === this.memory.spawnRoom)) {
		this.say('home pt');
		this.memory.state = 3;
	}

	if ((this.memory.state === 3) && (this.carry.energy === 0)) {
		this.say('empty');
		this.memory.state = 0;
	}


	if(this.memory.state === 0) {
		this.moveTo(myFlag);
	} else if(this.memory.state === 1) {
		// find energy pile
		let closestEnergy = this.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
				filter: (pile) => {
					return pile.energy >= (this.carryCapacity / 2);
				}
		});

		if(this.pickup(closestEnergy) === ERR_NOT_IN_RANGE) {
			this.moveTo(closestEnergy);
		}
	} else if(this.memory.state === 2) {
		this.moveTo(new RoomPosition(25, 25, this.memory.spawnRoom));
	} else if(this.memory.state === 3) {
		if(this.room.name != this.memory.spawnRoom) {
			this.moveTo(new RoomPosition(25, 25, this.memory.spawnRoom));
		} else {
			// transfer to closest link or storage
			let closestDropOff = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {
				filter: (structure) => {
					return ((structure.structureType === STRUCTURE_LINK) && (structure.energy < (structure.energyCapacity * 0.95))) || (structure.structureType === STRUCTURE_STORAGE);
				}
			});

			if(!closestDropOff) {
				closestDropOff = this.getRefillTarget();
			}

			if(closestDropOff) {
				if(this.transfer(closestDropOff, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
					this.moveTo(closestDropOff);
				}
			} else {
				this.say('bored');
			}
		}
	}
};

Creep.prototype.runRemoteCart = function() {
	let flagLoaded = this.loadFlag();
	if(!flagLoaded) {
		return;
	}

	// flag is loaded

	let hasLoad = this.hasLoad();
	if(hasLoad) {
		// have energy, head to drop off
		let homeStorage = Game.rooms[this.memory.spawnRoom].storage;
		if(!homeStorage) {
			this.errorLog('could not find home storage', ERR_NOT_FOUND, 4);
			return;
		}
		if(this.pos.isNearTo(homeStorage)) {
			this.transfer(homeStorage, RESOURCE_ENERGY);
		} else {
			this.blindMoveTo(homeStorage);
		}
	}

	let withinRoom = this.pos.roomName === myFlag.pos.roomName;
	if(!withinRoom) {
		this.blindMoveTo(this.myFlag);
		return;
	}

	// in the remote room

	let findSource = () => {
		let potentialSource = this.myFlag.pos.findClosestByRange(FIND_SOURCES);
	};
	let forgetSource = (s) => {
		return;
	};
	let source = this.rememberStructure(findSource, forgetSource, 'sourceStructureId', true);
	if(!source) {
		this.errorLog('could not find source near flag', ERR_NOT_FOUND, 4);
		return;
	}

	if(this.pos.getRangeTo(source) > 3) {
		this.blindMoveTo(source);
		return;
	}

	// near source to service

	let targets = this.room.find(FIND_DROPPED_ENERGY, {
			filter: (pile) => {
				return (pile.resourceType === RESOURCE_ENERGY && pile.energy >= 50);
			}
	});

	if(!targets) {
		targets = this.room.findStructures(STRUCTURE_CONTAINER);
	}

	if(targets) {
		let target = this.pos.findClosestByRange(targets);
		if(this.pos.isNearTo(target)) {
			this.takeResource(target, RESOURCE_ENERGY);
		} else {
			this.blindMoveTo(target);
		}
	}
};

Creep.prototype.runRemoteTransporter = function() {
	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 5);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND, 4);
			// start suicide
			this.memory.suicideCounter = this.memory.suicideCounter || 5;
			if(this.memory.suicideCounter === 4) {
			    countAllCreepFlags();
			} else if(this.memory.suicideCounter <= 1) {
			    delete Memory.creeps[this.name].suicideCounter;
				this.suicide();
			}
			if(typeof this.memory.suicideCounter !== 'undefined') {
			    this.memory.suicideCounter--;
			}
	        return;
		}
    }

	let carrySum = _.sum(this.carry);
	if(carrySum > 0) {
		// drop off all carry contents
		// at storage of destination room according to the flag name
		let destinationRoom = /_creep_remoteTransporter_([EW]\d+[NS]\d+)_/.exec(myFlag.name)[1];
		if(this.pos.roomName === destinationRoom) {
			if(!this.room.storage) {
				this.errorLog('no storage to drop off resources', ERR_NOT_FOUND, 5);
				return;
			}
			// TODO: make creep drop off all resources it is carrying
			if(this.transfer(this.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				this.moveTo(this.room.storage);
			}
		} else {
			this.moveTo(new RoomPosition(25, 25, destinationRoom));
		}
	} else {
		// go to my flag's room
		// once in flag's room, look for piles of energy at the flag position and then for structures like storage
		if(this.pos.roomName === myFlag.pos.roomName) {
			let resourcePiles = myFlag.pos.lookFor(LOOK_RESOURCES);
			if(isArrayWithContents(resourcePiles)) {
				if(this.pickup(resourcePiles[0]) === ERR_NOT_IN_RANGE) {
					this.moveTo(resourcePiles[0]);
				}
			} else {
				let structures = myFlag.pos.lookFor(LOOK_STRUCTURES);
				if(isArrayWithContents(structures)) {
					let structure = structures[0];
					// TODO: handle rampart case better
					if(structure.structureType === STRUCTURE_RAMPART && typeof structures[1] !== 'undefined') {
						structure = structures[1];
					}
					if(this.withdraw(structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
						this.moveTo(structure);
					}
				}
			}
		} else {
			this.moveTo(myFlag);
		}
	}
};

Creep.prototype.runReinforcer = function() {
	//this.say('reinforcer');
	// state 0 is get energy from storage
	// state 1 is repair a wall/rampart
	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if(this.carry.energy === this.carryCapacity) {
		if(this.memory.state === 0) {
			this.say('I\'m full!');

			let defences = this.room.find(FIND_STRUCTURES, {
					filter: (structure) => {
						return ((structure.structureType === STRUCTURE_WALL) || (structure.structureType === STRUCTURE_RAMPART)) && structure.hits < structure.hitsMax;
					}
			});
			let sortedDefences = _.sortBy(defences, function(defence) { return defence.hits; });
			this.memory.repairId = sortedDefences[0].id;
		}
		this.memory.state = 1;
	}

	if(this.carry.energy === 0) {
		if(this.memory.state === 1) {
			this.say('I\'m empty!');
		}
		this.memory.state = 0;
	}

	if(this.memory.state === 0) {
		// find storage
		let roomStorage = this.room.storage;
		if(this.withdraw(roomStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
			this.moveTo(roomStorage);
		}
	} else if(this.memory.state === 1) {
		// repair walls/ramparts
		if(this.memory.repairId === undefined) {
			let defences = this.room.find(FIND_STRUCTURES, {
					filter: (structure) => {
						return ((structure.structureType === STRUCTURE_WALL) || (structure.structureType === STRUCTURE_RAMPART)) && structure.hits < structure.hitsMax;
					}
			});
			let sortedDefences = _.sortBy(defences, function(defence) { return defence.hits; });
			this.memory.repairId = sortedDefences[0].id;
		}

		var currentDefence = Game.getObjectById(this.memory.repairId);

		if(this.repair(currentDefence) === ERR_NOT_IN_RANGE) {
			this.moveTo(currentDefence);
		}
	} else {
		this.memory.state = 0;
	}
};

Creep.prototype.runBuilder = function() {
	// state 0 is harvest
	// state 1 is work

	if(this.pos.roomName !== this.memory.spawnRoom) {
		this.moveTo(new RoomPosition(25, 25, this.memory.spawnRoom));
		return;
	}

	if(!this.memory.boosted && this.memory.flagName && Game.flags[this.memory.flagName] && Game.flags[this.memory.flagName].memory.boostPart && Game.flags[this.memory.flagName].memory.boostResource) {
		if(this.getBoosted(Game.flags[this.memory.flagName].memory.boostPart, Game.flags[this.memory.flagName].memory.boostResource) !== OK) {
			return;
		}
	}

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if(this.carry.energy === this.carryCapacity) {
		this.memory.state = 1;
	}

	if (this.carry.energy === 0) {
		this.memory.state = 0;
	}

	if(this.memory.state === 0) {
		// get energy piles
		var droppedEnergy = this.room.find(FIND_DROPPED_ENERGY, {
				filter: (pile) => {
					return (pile.energy >= (this.carryCapacity / 4)) && (pile.pos.roomName === this.memory.spawnRoom);
				}
		});

		//get links with energy or storage with enough surplus energy
		var structuresWithEnergy = this.room.find(FIND_STRUCTURES, {
				filter: (structure) => {
					return ((structure.structureType === STRUCTURE_LINK) && (structure.energy >= (this.carryCapacity / 4))) || ((structure.structureType === STRUCTURE_STORAGE) && (structure.store[RESOURCE_ENERGY] >= 10000));
				}
		});

		var energySources = [];

		for(let i in droppedEnergy) {
			energySources.push(droppedEnergy[i]);
		}

		for(let i in structuresWithEnergy) {
			energySources.push(structuresWithEnergy[i]);
		}

		var closestEnergy = this.pos.findClosestByPath(energySources);

		if(closestEnergy) {
			if(this.takeResource(closestEnergy, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				this.moveTo(closestEnergy);
			}
		} else {
			this.say('no energy');
		}
	} else {
		// work
		var targets = this.room.find(FIND_CONSTRUCTION_SITES);
		if(targets.length) {
			if(this.build(targets[0]) == ERR_NOT_IN_RANGE) {
				this.moveTo(targets[0]);
			}
		} else {
			if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
				this.moveTo(this.room.controller);
			}
		}
	}
};

Creep.prototype.runUpgrader = function() {
	// state 0 is harvest
	// state 1 is upgrade

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if(this.carry.energy === this.carryCapacity) {
		this.memory.state = 1;
	}

	if(this.carry.energy === 0) {
		this.memory.state = 0;
	}

	if(this.memory.state === 0) {
		// get energy piles
		let droppedEnergy = this.room.find(FIND_DROPPED_ENERGY, {
				filter: (pile) => {
					return (pile.energy >= (this.carryCapacity / 2)) && (pile.pos.roomName === this.memory.spawnRoom);
				}
		});

		//get links with energy or storage with enough surplus energy
		let structuresWithEnergy = this.room.find(FIND_STRUCTURES, {
				filter: (structure) => {
					return ((structure.structureType === STRUCTURE_LINK) && (structure.energy >= this.carryCapacity)) || ((structure.structureType === STRUCTURE_STORAGE) && (structure.store[RESOURCE_ENERGY] >= 1000)) || ((structure.structureType === STRUCTURE_TERMINAL) && (structure.store[RESOURCE_ENERGY] > 0));
				}
		});

		let energySources = [];

		for(let i in droppedEnergy) {
			energySources.push(droppedEnergy[i]);
		}

		for(let i in structuresWithEnergy) {
			energySources.push(structuresWithEnergy[i]);
		}

		let closestEnergy = this.pos.findClosestByPath(energySources);

		if(closestEnergy) {
			//if((closestEnergy.structureType === STRUCTURE_LINK) || (closestEnergy.structureType === STRUCTURE_STORAGE)) {
			//	if(!this.pos.isNearTo(closestEnergy)) {
			//		this.moveTo(closestEnergy);
			//	}
			//} else {
			//	if(this.pickup(closestEnergy) === ERR_NOT_IN_RANGE) {
			//		this.moveTo(closestEnergy);
			//	}
			//}

			if(this.pos.isNearTo(closestEnergy)) {
				this.takeResource(closestEnergy, RESOURCE_ENERGY);
			} else {
				this.moveTo(closestEnergy);
			}
		} else {
			this.say('no energy');
		}
	} else {
		// upgrade
		if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
			this.moveTo(this.room.controller);
		}
	}
};

Creep.prototype.runDefender = function() {
	let target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
	if(target) {
		if(this.attack(target) === ERR_NOT_IN_RANGE) {
			this.moveTo(target);
		}
	}
};

Creep.prototype.runReserver = function() {
	if(this.memory.controllerId === undefined) {
		return;
	}

	let controllerToReserve = Game.getObjectById(this.memory.controllerId);
	if(this.reserveController(controllerToReserve) === ERR_NOT_IN_RANGE) {
		this.moveTo(controllerToReserve, {
            costCallback: function(roomName, costMatrix) {
        	    if(roomName === 'E7S37') {
        		    for(i = 0; i < 50; i++) {
        		        for(j = 0; j < 50; j++) {
        		            costMatrix.set(i, j, 0xff);
        		        }
        		    }
        		}
        	}
        });
	}
};

Creep.prototype.runReserver2 = function() {
	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
	        return;
		}
    }

	if(this.pos.isEqualTo(myFlag)) {
		let reserveReturn = this.reserveController(this.room.controller);
        if(reserveReturn !== OK) {
			this.errorLog('could not successfully reserve controller', reserveReturn, 4);
        }
	} else {
		this.moveTo(myFlag, {
            costCallback: function(roomName, costMatrix) {
        	    if(roomName === 'E7S37') {
        		    for(i = 0; i < 50; i++) {
        		        for(j = 0; j < 50; j++) {
        		            costMatrix.set(i, j, 0xff);
        		        }
        		    }
        		}
        	}
        });
	}
};

Creep.prototype.runClaimer = function() {
	this.say('claimer');
	// state 0 is head to next room


	//let checkPoint1 = new RoomPosition(9, 11, 'E5S25');
	//let checkPoint2 = new RoomPosition(44, 2, 'W35S35');
	//let checkPoint3 = new RoomPosition(33, 33, 'W35S33');

	//let checkPoint1 = new RoomPosition(18, 4, 'E6S29');
	//let checkPoint2 = new RoomPosition(18, 4, 'E6S29');
	//let checkPoint3 = new RoomPosition(18, 4, 'E6S29');

	//let checkPoint1 = new RoomPosition(6, 45, 'E11S31');
	//let checkPoint2 = new RoomPosition(6, 45, 'E11S31');
	//let checkPoint3 = new RoomPosition(6, 45, 'E11S31');

	let checkPoint1 = new RoomPosition(16, 32, 'E11S34');
	let checkPoint2 = new RoomPosition(16, 32, 'E11S34');
	let checkPoint3 = new RoomPosition(16, 32, 'E11S34');


	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if((this.memory.state === 0) && ((JSON.stringify(this.pos) === JSON.stringify(checkPoint1)) || (this.room.name === 'W35S35'))) {
		this.say('chkpt 1');
		this.memory.state = 1;
	}

	if((this.memory.state === 1) && (JSON.stringify(this.pos) === JSON.stringify(checkPoint2))) {
		this.say('chkpt 2');
		this.memory.state = 2;
	}

	if((this.memory.state === 2) && (JSON.stringify(this.pos) === JSON.stringify(checkPoint3))) {
		this.say('chkpt 3');
		this.memory.state = 3;
	}

	if(this.memory.state === 0) {
		this.moveTo(checkPoint1);
	} else if(this.memory.state === 1) {
		this.moveTo(checkPoint2);
	} else if(this.memory.state === 2) {
		this.moveTo(checkPoint3);
	} else if(this.memory.state === 3) {
		var controllerToClaim = this.room.controller;
		if(this.claimController(controllerToClaim) === ERR_NOT_IN_RANGE) {
			this.moveTo(controllerToClaim);
		}
	}
};

Creep.prototype.runClaimer2 = function() {
	//this.say('claimer');

	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 5);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND, 4);
			// start suicide
			this.memory.suicideCounter = this.memory.suicideCounter || 5;
			if(this.memory.suicideCounter === 4) {
			    countAllCreepFlags();
			} else if(this.memory.suicideCounter <= 1) {
			    delete Memory.creeps[this.name].suicideCounter;
				this.suicide();
			}
			if(typeof this.memory.suicideCounter !== 'undefined') {
			    this.memory.suicideCounter--;
			}
	        return;
		}
    }

	if(this.pos.isEqualTo(myFlag)) {
		if(typeof myFlag.memory.signMessage === 'string') {
			let signReturn = this.signController(this.room.controller, myFlag.memory.signMessage);
			if(signReturn !== OK) {
				this.errorLog('could not successfully sign controller', signReturn, 4);
			}
		} else {
			let claimReturn = this.claimController(this.room.controller);
	        if(claimReturn !== OK) {
				this.errorLog('could not successfully claim controller', claimReturn, 4);
	        }
		}
	} else {
		this.travelTo(myFlag, { 'useFindRoute': true });
	}
};

Creep.prototype.runAttackClaimer = function() {
	this.say('attackC');
	// state 0 is head to next room

    //Markoez room
	//let checkPoint1 = new RoomPosition(44, 30, 'E6S29');
	//let checkPoint2 = new RoomPosition(44, 30, 'E6S29');
	//let checkPoint3 = new RoomPosition(44, 30, 'E6S29');

	// n0ne's room
	//let checkPoint1 = new RoomPosition(32, 21, 'E5S31');
	//let checkPoint2 = new RoomPosition(32, 21, 'E5S31');
	//let checkPoint3 = new RoomPosition(32, 21, 'E5S31');

	//Aachi's room
	let checkPoint1 = new RoomPosition(16, 32, 'E11S34');
	let checkPoint2 = new RoomPosition(16, 32, 'E11S34');
	let checkPoint3 = new RoomPosition(16, 32, 'E11S34');

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if((this.memory.state === 0) && (JSON.stringify(this.pos) === JSON.stringify(checkPoint1))) {
		this.say('chkpt 1');
		this.memory.state = 1;
	}

	if((this.memory.state === 1) && (JSON.stringify(this.pos) === JSON.stringify(checkPoint2))) {
		this.say('chkpt 2');
		this.memory.state = 2;
	}

	if((this.memory.state === 2) && (JSON.stringify(this.pos) === JSON.stringify(checkPoint3))) {
		this.say('chkpt 3');
		this.memory.state = 3;
	}

	if(this.memory.state === 0) {
		this.moveTo(checkPoint1);
	} else if(this.memory.state === 1) {
		this.moveTo(checkPoint2);
	} else if(this.memory.state === 2) {
		this.moveTo(checkPoint3);
	} else if(this.memory.state === 3) {
		var controllerToClaim = this.room.controller;
		if(this.attackController(controllerToClaim) === ERR_NOT_IN_RANGE) {
			this.moveTo(controllerToClaim);
		}
	}
};

Creep.prototype.runAttackClaimer2 = function() {
	//this.say('attackClaimer');

	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 5);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND, 4);
			// start suicide
			this.memory.suicideCounter = this.memory.suicideCounter || 5;
			if(this.memory.suicideCounter === 4) {
			    countAllCreepFlags();
			} else if(this.memory.suicideCounter <= 1) {
			    delete Memory.creeps[this.name].suicideCounter;
				this.suicide();
			}
			if(typeof this.memory.suicideCounter !== 'undefined') {
			    this.memory.suicideCounter--;
			}
	        return;
		}
    }

	if(this.pos.isEqualTo(myFlag)) {
		let attackReturn = this.attackController(this.room.controller);
        if(attackReturn !== OK) {
			this.errorLog('could not successfully attack controller', attackReturn, 4);
        }
	} else {
		this.travelTo(myFlag, { 'useFindRoute': true });
	}
};

Creep.prototype.runExplorer = function() {
	//this.say('explorer');
	// state 0 is head to next room
	// state 1 harvest
	// state 2 is head back to home room
	// state 3 is upgrade controller

	var checkPointAway = new RoomPosition(31, 29, 'E9S23');
	var checkPointHome = new RoomPosition(47, 9, 'E8S23');

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if((this.memory.state === 0) && (JSON.stringify(this.pos) === JSON.stringify(checkPointAway))) {
		this.say('away pt');
		this.memory.state = 1;
	}

	if((this.memory.state === 1) && (this.carry.energy === this.carryCapacity)) {
		this.say('full');
		this.memory.state = 2;
	}

	if((this.memory.state === 2) && (JSON.stringify(this.pos) === JSON.stringify(checkPointHome))) {
		this.say('home pt');
		this.memory.state = 3;
	}

	if ((this.memory.state === 3) && (this.carry.energy === 0)) {
		this.say('empty');
		this.memory.state = 0;
	}


	if(this.memory.state === 0) {
		this.moveTo(checkPointAway);
	} else if(this.memory.state === 1) {
		// harvest
		var closestSource = this.pos.findClosestByPath(FIND_SOURCES);
		if(this.harvest(closestSource) === ERR_NOT_IN_RANGE) {
			this.moveTo(closestSource);
		}
	} else if(this.memory.state === 2) {
		this.moveTo(checkPointHome);
	} else if(this.memory.state === 3) {
		// transfer to link if there is one that isn't full
		var closestLink = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType === STRUCTURE_LINK) && (structure.energy < structure.energyCapacity);
				}
		});

		if(closestLink) {
			if(this.transfer(closestLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				this.moveTo(closestLink);
			}
		} else {
			//drop energy
			this.drop(RESOURCE_ENERGY);
		}
	}
};

Creep.prototype.runRemoteUpgrader = function() {
	//this.say('remoteUpgrader');
	// state 0 is head to next room


	//var checkPoint1 = new RoomPosition(35, 35, 'E7S35');
	//var checkPoint2 = new RoomPosition(35, 35, 'E7S35');
	//var checkPoint3 = new RoomPosition(35, 35, 'E7S35');

	//let checkPoint1 = new RoomPosition(14, 42, 'E5S30');
	//let checkPoint2 = new RoomPosition(34, 24, 'E4S31');
	//let checkPoint3 = new RoomPosition(34, 24, 'E4S31');

	let checkPoint1 = new RoomPosition(30, 18, 'E11S35');
	let checkPoint2 = new RoomPosition(30, 18, 'E11S35');
	let checkPoint3 = new RoomPosition(30, 18, 'E11S35');


	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if((this.memory.state === 0) && (JSON.stringify(this.pos) === JSON.stringify(checkPoint1))) {
		this.say('chkpt 1');
		this.memory.state = 1;
	}

	if((this.memory.state === 1) && (JSON.stringify(this.pos) === JSON.stringify(checkPoint2))) {
		this.say('chkpt 2');
		this.memory.state = 2;
	}

	if((this.memory.state === 2) && (JSON.stringify(this.pos) === JSON.stringify(checkPoint3))) {
		this.say('chkpt 3');
		this.memory.state = 3;
	}

	if((this.memory.state === 3) && (this.carry.energy === this.carryCapacity)) {
		this.memory.state = 4;
	}

	if ((this.memory.state === 4) && (this.carry.energy === 0)) {
		this.memory.state = 3;
	}

	if(this.memory.state === 0) {
		this.moveTo(checkPoint1);
	} else if(this.memory.state === 1) {
		this.moveTo(checkPoint2);
	} else if(this.memory.state === 2) {
		this.moveTo(checkPoint3);
	} else if(this.memory.state === 3) {
		// harvest
		//var sources = this.room.find(FIND_SOURCES);
		//if(this.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
		//	this.moveTo(sources[0]);
		//}

		let roomStorage = this.room.storage;
		if(this.withdraw(roomStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		    this.moveTo(roomStorage);
		}

		//let roomTerminal = this.room.terminal;
		//if(this.withdraw(roomTerminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		//    this.moveTo(roomTerminal);
		//}
	} else if(this.memory.state === 4) {
		// upgrade
		if(this.upgradeController(this.room.controller) === ERR_NOT_IN_RANGE) {
			this.moveTo(this.room.controller);
		}
	}
};

Creep.prototype.runRemoteBuilder = function() {
	//this.say('remoteBuilder');
	// state 0 is head to next room


	//let checkPoint1 = new RoomPosition(21, 5, 'E9S24');
	//let checkPoint2 = new RoomPosition(21, 5, 'E9S24');
	//let checkPoint3 = new RoomPosition(21, 5, 'E9S24');

    //let checkPoint1 = new RoomPosition(30, 48, 'E5S28');
	//let checkPoint2 = new RoomPosition(24, 29, 'E6S32');
	//let checkPoint3 = new RoomPosition(24, 29, 'E6S32');

	//let checkPoint1 = new RoomPosition(46, 34, 'E7S30');
	//let checkPoint2 = new RoomPosition(27, 4, 'E8S32');
	//let checkPoint3 = new RoomPosition(27, 4, 'E8S32');

    //let checkPoint1 = new RoomPosition(34, 30, 'E7S34');
	//let checkPoint2 = new RoomPosition(34, 30, 'E7S34');
	//let checkPoint3 = new RoomPosition(34, 30, 'E7S34');

	//let checkPoint1 = new RoomPosition(43, 34, 'E7S35');
	//let checkPoint2 = new RoomPosition(43, 34, 'E7S35');
	//let checkPoint3 = new RoomPosition(43, 34, 'E7S35');

	//let checkPoint1 = new RoomPosition(2, 34, 'E9S36');
	//let checkPoint2 = new RoomPosition(35, 10, 'E9S38');
	//let checkPoint3 = new RoomPosition(35, 10, 'E9S38');

	//let checkPoint1 = new RoomPosition(18, 4, 'E6S29');
	//let checkPoint2 = new RoomPosition(18, 4, 'E6S29');
	//let checkPoint3 = new RoomPosition(18, 4, 'E6S29');

	//let checkPoint1 = new RoomPosition(6, 45, 'E11S31');
	//let checkPoint2 = new RoomPosition(6, 45, 'E11S31');
	//let checkPoint3 = new RoomPosition(6, 45, 'E11S31');

	let checkPoint1 = new RoomPosition(18, 32, 'E12S34');
	let checkPoint2 = new RoomPosition(18, 32, 'E12S34');
	let checkPoint3 = new RoomPosition(18, 32, 'E12S34');

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if((this.memory.state === 0) && (JSON.stringify(this.pos) === JSON.stringify(checkPoint1))) {
		this.say('chkpt 1');
		this.memory.state = 1;
	}

	if((this.memory.state === 1) && (JSON.stringify(this.pos) === JSON.stringify(checkPoint2))) {
		this.say('chkpt 2');
		this.memory.state = 2;
	}

	if((this.memory.state === 2) && (JSON.stringify(this.pos) === JSON.stringify(checkPoint3))) {
		this.say('chkpt 3');
		this.memory.state = 3;
	}

	if((this.memory.state === 3) && (this.carry.energy === this.carryCapacity)) {
		this.memory.state = 4;
	}

	if ((this.memory.state === 4) && (this.carry.energy === 0)) {
		this.memory.state = 3;
	}

	if(this.memory.state === 0) {
		this.moveTo(checkPoint1);
	} else if(this.memory.state === 1) {
		this.moveTo(checkPoint2);
	} else if(this.memory.state === 2) {
		this.moveTo(checkPoint3);
	} else if(this.memory.state === 3) {
		// harvest
		var sources = this.room.find(FIND_SOURCES);
		if(this.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
			this.moveTo(sources[0]);
		}
	} else if(this.memory.state === 4) {
		// work
		var targets = this.room.find(FIND_CONSTRUCTION_SITES);
		if(targets.length) {
			if(this.build(targets[0]) == ERR_NOT_IN_RANGE) {
				this.moveTo(targets[0]);
			}
		} else {
			if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
				this.moveTo(this.room.controller);
			}
		}
	}
};

Creep.prototype.runRemoteBuilder2 = function() {
	//this.say('remoteBuilder');

	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 5);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND, 4);
			// start suicide
			this.memory.suicideCounter = this.memory.suicideCounter || 5;
			if(this.memory.suicideCounter === 4) {
			    countAllCreepFlags();
			} else if(this.memory.suicideCounter <= 1) {
			    delete Memory.creeps[this.name].suicideCounter;
				this.suicide();
			}
			if(typeof this.memory.suicideCounter !== 'undefined') {
			    this.memory.suicideCounter--;
			}
	        return;
		}
    }

	if(this.pos.roomName !== myFlag.pos.roomName) {
		this.travelTo(myFlag, { 'useFindRoute': true });
		return;
	}

	if(this.memory.state === undefined) {
		this.memory.state = 0;
	}

	if(this.carry.energy === this.carryCapacity) {
		if(this.memory.state === 0) {
			this.say('I\'m full!');
		}
		this.memory.state = 1;
	}

	if(this.carry.energy === 0) {
		if(this.memory.state == 1) {
			this.say('I\'m empty!');
		}
		this.memory.state = 0;
	}

	if(this.memory.state === 0) {
		// harvest
		let mySource = Game.getObjectById(this.memory.mySourceId);
        if(mySource === null) {
			// TODO: assuming lookForAt is cheaper, change to use that instead of findClosestByRange for the source
            mySource = myFlag.pos.findClosestByRange(FIND_SOURCES);
            this.memory.mySourceId = mySource.id;
        }

		if(this.harvest(mySource) === ERR_NOT_IN_RANGE) {
			this.moveTo(mySource);
		}
	} else {
		// work
		var targets = this.room.find(FIND_CONSTRUCTION_SITES);
		if(targets.length) {
			if(this.build(targets[0]) == ERR_NOT_IN_RANGE) {
				this.moveTo(targets[0]);
			}
		} else {
			if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
				this.moveTo(this.room.controller);
			}
		}
	}
};

Creep.prototype.runMineralCarrier = function() {
	if(typeof this.memory.task === 'undefined') {
		this.memory.task = 'return';
	}

	if(this.memory.task === 'transfer') {
		this.runMineralTransfer();
	} else if(this.memory.task === 'return') {
		this.runMineralReturn();
	} else {
		this.errorLog('unknown task: ' + this.memory.task, ERR_INVALID_TARGET, 4);
	}
};

Creep.prototype.runMineralTransfer = function() {
	// find mineral transfer job flag for current task

	// filter for room mineral transfer flags
	let roomTransferFlagRegex = new RegExp('^' + this.memory.spawnRoom + '_mineralTransfer_');
	let roomTransferFlags = _.filter(Game.flags, (flag) => roomTransferFlagRegex.test(flag.name) === true);

	if(!roomTransferFlags.length) {
		this.log('no mineral transfer flags left in room; switching task to mineral return', 0);
		this.memory.task = 'return';
		return;
	}

	let firstTransferFlag = roomTransferFlags[0];

	let flagMineralReturn = /_mineralTransfer_(.+)/.exec(firstTransferFlag.name);

	if(flagMineralReturn === null) {
		this.errorLog('found mineral transfer flag with no mineral', ERR_NOT_FOUND, 4);
		return;
	}

	let flagMineral = flagMineralReturn[1];

	let flagPosStructures = this.room.lookForAt(LOOK_STRUCTURES, firstTransferFlag);

	//if(!flagPosStructures.length) {
	//	this.errorLog('no structure found under flag (' + firstTransferFlag.name + ')', ERR_NOT_FOUND);
	//	return;
	//}

	// TODO: make this work if a rampart is on top
	//let lab = flagPosStructures[0];
	let lab = getStructure(flagPosStructures, STRUCTURE_LAB);

	if(!lab || lab.structureType !== STRUCTURE_LAB) {
		this.errorLog('could not find lab structure under flag' + firstTransferFlag.name, ERR_NOT_FOUND, 4);
		return;
	}

	if((typeof firstTransferFlag.memory.minerals !== 'undefined' && firstTransferFlag.memory.minerals <= 0) || (lab.mineralAmount === LAB_MINERAL_CAPACITY)) {
		this.log('lab full, removing flag(' + firstTransferFlag.name + ')');
		delete Memory.flags[firstTransferFlag.name];
		firstTransferFlag.remove();
		return;
	}

	firstTransferFlag.memory.minerals = firstTransferFlag.memory.minerals || LAB_MINERAL_CAPACITY;

	if(_.sum(this.carry) > 0) {
		//drop off minerals at lab
		let load = this.carry[flagMineral];
		let transferReturn = this.transfer(lab, flagMineral);
		if(transferReturn === OK) {
		    firstTransferFlag.memory.minerals = firstTransferFlag.memory.minerals - load;
		} else if(transferReturn === ERR_NOT_IN_RANGE) {
			this.moveTo(lab);
		}
	} else {
		// get minerals from terminal
		if(typeof this.room.terminal === 'undefined') {
			this.errorLog('no terminal', ERR_NOT_FOUND, 4);
			return;
		}

		let terminalAmount = undefToZero(this.room.terminal.store[flagMineral]);

		let transferAmount = Math.min(firstTransferFlag.memory.minerals, this.carryCapacity, terminalAmount);

		if(transferAmount === 0) {
			this.errorLog('transfer amount is 0; removing flag', ERR_NOT_ENOUGH_RESOURCES);
			delete Memory.flags[firstTransferFlag.name];
			firstTransferFlag.remove();
			return;
		}

		if(this.withdraw(this.room.terminal, flagMineral, transferAmount) === ERR_NOT_IN_RANGE) {
			this.moveTo(this.room.terminal);
		}
	}

};

Creep.prototype.runMineralReturn = function() {
	if(_.sum(this.carry) > 0) {
		// drop off minerals at terminal

		if(typeof this.room.terminal === 'undefined') {
			this.errorLog('no terminal', ERR_NOT_FOUND, 4);
			return;
		}

        let maxResourceType = RESOURCE_ENERGY;
		for(let resource in this.carry) {
			if((this.carry[resource] > 0) && (this.carry[resource] > this.carry[maxResourceType])) {
				maxResourceType = resource;
			}
		}

		if(this.transfer(this.room.terminal, maxResourceType) === ERR_NOT_IN_RANGE) {
			this.moveTo(this.room.terminal);
		}
	} else {
	    // find mineral return job flag for current task

    	// filter for room mineral return flags
    	let roomTransferFlagRegex = new RegExp('^' + this.memory.spawnRoom + '_mineralReturn_');
    	let roomTransferFlags = _.filter(Game.flags, (flag) => roomTransferFlagRegex.test(flag.name) === true);

    	if(!roomTransferFlags.length) {
    		this.log('no mineral return flags left in room; switching task to mineral transfer', 0);
    		this.memory.task = 'transfer';
    		return;
    	}

    	let firstTransferFlag = roomTransferFlags[0];

    	let flagMineralReturn = /_mineralReturn_(.+)/.exec(firstTransferFlag.name);

    	if(flagMineralReturn === null) {
    		this.errorLog('found mineral return flag with no mineral', ERR_NOT_FOUND);
    		return;
    	}

    	let flagMineral = flagMineralReturn[1];

    	let lab;

    	if(flagMineral === 'all') {
    	    let nonEmptyLabs = this.room.find(FIND_MY_STRUCTURES, {
    	        filter: (structure) => {
    	            return structure.structureType === STRUCTURE_LAB && structure.mineralAmount > 0;
    	        }
    	    });

    	    lab = getStructure(nonEmptyLabs, STRUCTURE_LAB);
    	} else {
        	let flagPosStructures = this.room.lookForAt(LOOK_STRUCTURES, firstTransferFlag);

        	//if(!flagPosStructures.length) {
        	//	this.errorLog('no structure found under flag (' + firstTransferFlag.name + ')', ERR_NOT_FOUND);
        	//	return;
        	//}

        	// TODO: make this work if a rampart is on top
        	//let lab = flagPosStructures[0];

        	lab = getStructure(flagPosStructures, STRUCTURE_LAB);
    	}

    	if(!lab || lab.structureType !== STRUCTURE_LAB) {
    		this.errorLog('could not find lab structure for flag ' + firstTransferFlag.name + ' - removing flag', ERR_NOT_FOUND, 3);
    		firstTransferFlag.remove();
    		return;
    	}

    	if((lab.mineralAmount === 0) && (_.sum(this.carry) === 0)) {
    		this.log('lab empty, removing flag(' + firstTransferFlag.name + ')');
    		firstTransferFlag.remove();
    		return;
    	}

		// get minerals from lab
		if(this.withdraw(lab, lab.mineralType) === ERR_NOT_IN_RANGE) {
			this.moveTo(lab);
		}
	}

};

Creep.prototype.runPowerBankAttacker = function() {
    // to account for case where medic takes longer to spawn than the attacker
    if(this.ticksToLive > (CREEP_LIFE_TIME - 30)) {
        return;
    }

	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
			// start suicide
			this.memory.suicideCounter = this.memory.suicideCounter || 5;
			if(this.memory.suicideCounter === 4) {
			    countAllC();
			} else if(this.memory.suicideCounter <= 1) {
			    delete Memory.creeps[this.name].suicideCounter;

			    let flagCreeps = _.filter(Game.creeps, (creep) => {
			        return (creep.memory.flagName === this.memory.flagName);
			    });

			    if(isArrayWithContents(flagCreeps)) {
			        for(let i in flagCreeps) {
			            // this should get them all
			            // if this creep can't do thing after calling suicide
			            // then call separately after and avoid calling here
			            flagCreeps[i].suicide();
			        }
			    }
			}
			if(typeof this.memory.suicideCounter !== 'undefined') {
			    this.memory.suicideCounter--;
			}
	        return;
		}
    }

    if(this.pos.roomName === myFlag.pos.roomName) {
		let roomStructures = this.room.find(FIND_STRUCTURES);
		let powerBank = getStructure(roomStructures, STRUCTURE_POWER_BANK);
		if(!powerBank) {
			this.log('no power bank in my flag\'s room');
			if(this.pos.isEqualTo(myFlag)) {
			    delete Memory.flags[myFlag.name];
			    //myFlag.memory.destroy = false;
			    myFlag.remove();
			} else {
			    this.moveTo(myFlag);
			}
			return;
		}

		if(powerBank.hits <= 10000 && myFlag.memory.destroy !== true) {
		    // check for collectors every X ticks (odd number in case they are flickering on a room border)
		    if(Game.time % 11 === 0) {
		        // filter for powerCollector flags for this room
            	let flagRegex = new RegExp('_remote_' + this.pos.roomName + '_creep_powerCollector_');
            	let powerColFlags = _.filter(Game.flags, (flag) => flagRegex.test(flag.name) === true);

            	if(isArrayWithContents(powerColFlags)) {
            	    let powerColCreeps = _.filter(Game.creeps, (creep) => {
            	        // could also check if the powerCollectors are waiting on their flags
            	        return ((creep.pos.roomName === this.pos.roomName) && (creep.memory.role === 'powerCollector'));
            	    });

            	    if(isArrayWithContents(powerColCreeps) && powerColCreeps.length === powerColFlags.length) {
            	        myFlag.memory.destroy = true;
            	    }
            	}
		    }

			// if the power bank is about to decay, just destroy it
			// hopefully collectors are on the way
			if(powerBank.ticksToDecay < 25) {
				myFlag.memory.destroy = true;
			}

			// don't destroy until collectors are available
			return;
		}

		if(this.attack(powerBank) === ERR_NOT_IN_RANGE) {
			if((Game.time % 3) !== 0) {
				return;
			}
			this.moveTo(powerBank);
		}
	} else {
	    /*
		this.moveTo(myFlag, {
			costCallback: function(roomName, costMatrix) {
				if(roomName === 'E7S37') {
					for(i = 0; i < 50; i++) {
						for(j = 0; j < 50; j++) {
							costMatrix.set(i, j, 0xff);
						}
					}
				}
			}
		});
		*/
		this.travelTo(myFlag, { 'useFindRoute': true });
	}
};

Creep.prototype.runPowerCollector = function() {
	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 4);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
			// start suicide
			this.memory.suicideCounter = this.memory.suicideCounter || 5;
			if(this.memory.suicideCounter === 4) {
			    countAllC();
			} else if(this.memory.suicideCounter <= 1) {
			    delete Memory.creeps[this.name].suicideCounter;
				this.suicide();
			}
			if(typeof this.memory.suicideCounter !== 'undefined') {
			    this.memory.suicideCounter--;
			}
	        return;
		}
    }

	let carrySum = _.sum(this.carry);
	if(carrySum > 0) {
		// return power
		let spawnRoomStorage = Game.rooms[this.memory.spawnRoom].storage;
		if(!spawnRoomStorage) {
			this.errorLog('could not find spawn room storage', ERR_NOT_FOUND, 4);
			return;
		}
		let highestQuantityResourceType = this.getHighestQuantityResourceType();
		if(this.transfer(spawnRoomStorage, highestQuantityResourceType) === ERR_NOT_IN_RANGE) {
			this.moveTo(spawnRoomStorage, {
                costCallback: function(roomName, costMatrix) {
            	    if(roomName === 'E7S37') {
            		    for(i = 0; i < 50; i++) {
            		        for(j = 0; j < 50; j++) {
            		            costMatrix.set(i, j, 0xff);
            		        }
            		    }
            		}
            	}
            });
		}
	} else {
		// get power and energy
    	if(this.pos.roomName === myFlag.pos.roomName) {
			let roomResources = this.room.find(FIND_DROPPED_RESOURCES);

			// look for power piles first
			let resourcePiles = getResourcesOfType(roomResources, RESOURCE_POWER);

			// look for energy piles if there are no power piles
			if(!isArrayWithContents(resourcePiles)) {
				resourcePiles = getResourcesOfType(roomResources, RESOURCE_ENERGY);
			}

			if(!isArrayWithContents(resourcePiles)) {
				this.log('no power or energy in my flag\'s room');
				// if position is equal to my flag
				    // check if there are any power banks in the room
				    // if not, room has been cleared so clear flag
				if(this.pos.isEqualTo(myFlag)) {
					let roomStructures = this.room.find(FIND_STRUCTURES);
					let powerBank = getStructure(roomStructures, STRUCTURE_POWER_BANK);
					if(!powerBank) {
					    myFlag.remove();
					}
				} else {
					this.moveTo(myFlag);
				}
				return;
			}
			let closestResourcePile = this.pos.findClosestByRange(resourcePiles);
			if(this.pickup(closestResourcePile) === ERR_NOT_IN_RANGE) {
				this.moveTo(closestResourcePile);
			}
		} else {
			this.moveTo(myFlag, {
                costCallback: function(roomName, costMatrix) {
            	    if(roomName === 'E7S37') {
            		    for(i = 0; i < 50; i++) {
            		        for(j = 0; j < 50; j++) {
            		            costMatrix.set(i, j, 0xff);
            		        }
            		    }
            		}
            	}
            });
		}
	}
};

Creep.prototype.runPowerCarrier = function() {
	let myRoomStructures = this.room.find(FIND_MY_STRUCTURES);
	let powerSpawn = getStructure(myRoomStructures, STRUCTURE_POWER_SPAWN);
	if(!powerSpawn) {
		this.errorLog('could not find power spawn', ERR_NOT_FOUND, 4);
		return ERR_NOT_FOUND;
	}

	let carrySum = _.sum(this.carry);

	if(powerSpawn.power > 0) {
		if(carrySum > 0) {
			// drop off anything extra
			let resource = this.getHighestQuantityResourceType();
			if(this.transfer(this.room.terminal, resource) === ERR_NOT_IN_RANGE) {
				this.moveTo(this.room.terminal);
			}
		}
		return OK;
	}

	if(carrySum > 0) {
		if(this.carry[RESOURCE_POWER] > 0) {
			// drop off power at power spawn
			if(this.transfer(powerSpawn, RESOURCE_POWER) === ERR_NOT_IN_RANGE) {
				this.moveTo(powerSpawn);
			}
		} else {
			// carrying some other resource for some reason
			let resource = this.getHighestQuantityResourceType();
			if(this.transfer(this.room.terminal, resource) === ERR_NOT_IN_RANGE) {
				this.moveTo(this.room.terminal);
			}
		}
	} else {
		// get power from terminal
		let powerAmount = Math.min(this.carryCapacity, POWER_SPAWN_POWER_CAPACITY, undefToZero(this.room.terminal.store.power));
		if(powerAmount > 0) {
    		if(this.withdraw(this.room.terminal, RESOURCE_POWER, powerAmount) === ERR_NOT_IN_RANGE) {
    			this.moveTo(this.room.terminal);
    		}
		} else {
		    // this should keep him more out of the way
		    this.moveTo(powerSpawn);
		}
	}
};

Creep.prototype.runPaver = function() {
	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND, 5);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
			// start suicide
			this.memory.suicideCounter = this.memory.suicideCounter || 5;
			if(this.memory.suicideCounter === 4) {
			    countAllC();
			} else if(this.memory.suicideCounter <= 1) {
			    delete Memory.creeps[this.name].suicideCounter;
				this.suicide();
			}
			if(typeof this.memory.suicideCounter !== 'undefined') {
			    this.memory.suicideCounter--;
			}
	        return;
		}
    }

	// let fleeing = paver.fleeHostiles();
	// if (fleeing) return; // early

	let withinRoom = this.pos.roomName === myFlag.pos.roomName;
	if(!withinRoom) {
		this.blindMoveTo(myFlag);
		return;
	}

	// I'm in the room
	// this.memory.scavanger = RESOURCE_ENERGY;
	let hasLoad = this.hasLoad();
	if(!hasLoad) {
		// TODO implement energy procurement better
		//this.procureEnergy(paver);
		if(this.room.storage && this.room.storage.store.energy > this.carryCapacity) {
			if(this.withdraw(this.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				this.blindMoveTo(this.room.storage);
				return;
			}
		}

		// get energy piles
		var droppedEnergy = this.room.find(FIND_DROPPED_ENERGY, {
				filter: (pile) => {
					return (pile.energy >= (this.carryCapacity / 4)) && (pile.pos.roomName === myFlag.pos.roomName);
				}
		});

		if(isArrayWithContents(droppedEnergy)) {
			let target = this.pos.findClosestByPath(droppedEnergy);
			if(target) {
				if(this.pickup(target) === ERR_NOT_IN_RANGE) {
					this.blindMoveTo(target);
				}
			}
		}
		return;
	}

	// I'm in the room and I have energy
	let findRoad = () => {
		return _.filter(this.room.findStructures(STRUCTURE_ROAD), (s) => s.hits < s.hitsMax - 1000)[0];
	};
	let forget = (s) => s.hits === s.hitsMax;
	let target = this.rememberStructure(findRoad, forget);
	if(!target) {
		let repairing = false;
		/*
		if(this.room.controller && this.room.controller.my) {
			repairing = this.repairContainers(paver);
		}
		*/
		if(!repairing) {
			this.memory.hasLoad = this.carry.energy === this.carryCapacity;
			this.idleOffRoad(myFlag);
		}
		this.blindMoveTo(myFlag);
		return;
	}


	// and I have a target
	let range = this.pos.getRangeTo(target);
	if(range > 3) {
		this.blindMoveTo(target);
		// repair any damaged road i'm standing on
		let road = this.pos.lookForStructure(STRUCTURE_ROAD);
		if(road && road.hits < road.hitsMax - 100) {
			this.repair(road);
		}
		return;
	}

	// and i'm in range
	this.repair(target);
	this.yieldRoad(target);
};
