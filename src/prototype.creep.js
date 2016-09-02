/* jshint esversion: 6 */
/*
 * prototype.creep
 */

Creep.prototype.run = function() {
	if(this.memory.role === 'miner') {
		this.runMiner2();
	} else if(this.memory.role === 'carrier') {
		this.runCarrier();
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
	} else if(this.memory.role === 'remoteCarrier') {
		this.runRemoteCarrier2();
	} else if(this.memory.role === 'reserver') {
		this.runReserver();
	} else if(this.memory.role === 'claimer') {
		this.runClaimer();
	} else if(this.memory.role === 'explorer') {
		this.runExplorer();
	} else if(this.memory.role === 'remoteUpgrader') {
		this.runRemoteUpgrader();
	} else if(this.memory.role === 'remoteBuilder') {
		this.runRemoteBuilder();
	} else if(this.memory.role === 'specialCarrier') {
		this.runSpecialCarrier();
	} else if(this.memory.role === 'dismantler') {
		this.runDismantler2();
	} else if(this.memory.role === 'medic') {
		this.runMedic();
	} else if(this.memory.role === 'scout') {
		this.runScout();
	} else if(this.memory.role === 'soldier') {
		this.runSoldier();
    } else {
        console.log('!!!Error: creep ' + this.name + ' has no role function!!!');
    }
};

Creep.prototype.log = function(msg) {
	return console.log('creep: ' + this.name + ' (' + this.room.name + '), msg: ' + msg);
};

Creep.prototype.errorLog = function(msg, errCode) {
	return console.log('!!!Error!!! creep: ' + this.name + ' (' + this.room.name + '), msg: ' + msg + ' (' + errCode + ')');
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

Creep.prototype.getRefillTarget = function() {
	let closestTarget;

	// if room energy is < 300, fill extensions first so spawn can generate energy
	if(this.room.energyAvailable < 300) {
		closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity;
				}
		});

		if(!closestTarget) {
			closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
					}
			});
		}
	} else {
		closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_EXTENSION ||
							structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
				}
		});
	}

	// refill towers if no spawns or extensions need refilling
	if(!closestTarget) {
		closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_TOWER) && structure.energy < (structure.energyCapacity - 20);
				}
		});
	}

	// refill labs if no spawns or extensions or towers need refilling
	if(!closestTarget) {
		closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType === STRUCTURE_LAB) && structure.energy < structure.energyCapacity;
				}
		});
	}

	// top up terminal if no spawns or extensions or towers or labs need refilling
	if(!closestTarget) {
		if(this.room.terminal && (this.room.terminal.store.energy < this.room.terminal.getResourceQuota(RESOURCE_ENERGY))) {
			closestTarget = this.room.terminal;
		}
	}

	return closestTarget;
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
        console.log('!!!Error: ' + this.name + ' has no flag in memory!!!');
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
            console.log('!!!Error: ' + this.name + ' (' + this.room.name + ') could not successfully harvest (' + harvestReturn + ')');
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
                console.log('!!!Error: ' + this.name + ' (' + this.room.name + ') could not successfully transfer (' + transferReturn + ')');
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
        console.log('!!!Error: ' + this.name + ' has no flag in memory!!!');
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
        this.errorLog('no flag in memory', ERR_NOT_FOUND);
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
					this.errorLog('could not successfully transfer', transferReturn);
				}
			}
		} else {
			let myLink = Game.getObjectById(this.memory.myLinkId);
	        if(myLink === null) {
	            myLink = myFlag.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_LINK}});
	            this.memory.myLinkId = myLink.id;
	        }

			if(!myLink) {
				this.errorLog('could not find link', ERR_NOT_FOUND);
				return;
			}

			if(myLink.energy > 0) {
				this.withdraw(myLink, RESOURCE_ENERGY);
			} else if(this.room.terminal && (undefToZero(this.room.terminal.store.energy) > this.room.terminal.getResourceQuota(RESOURCE_ENERGY))) {
				// TODO: upgrade to have linkers remove excess of other resource types as well
				let excessEnergy = this.room.terminal.store.energy - this.room.terminal.getResourceQuota(RESOURCE_ENERGY);
				let withdrawEnergy = Math.min(this.carryCapacity, excessEnergy);
				this.withdraw(this.room.terminal, RESOURCE_ENERGY);
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

Creep.prototype.getHighestQuantityResourceType = function() {
	let maxResourceType = RESOURCE_ENERGY;
	let maxResourceQuantity = 0;

	for(let curResourceType in this.carry) {
		if(this.carry[curResourceType] > maxResourceQuantity) {
			maxResourceQuantity = this.carry[curResourceType];
			maxResourceType = curResourceType;
		}
	}

	return maxResourceType;
};

// take a resource from anything else
Creep.prototype.takeResource = function(target, resource, amount) {
    if (typeof target === 'string') {
        target = Game.getObjectById(target);
    }

    if (target instanceof Mineral ||
        target instanceof Source) {
            return this.harvest(target);
    }

    if (target instanceof Resource) {
        return this.pickup(target);
    }

    if (target instanceof Creep) {
        return target.transfer(this, resource, amount);
    }

    if (target instanceof StructurePowerSpawn ||
        target instanceof StructureExtension ||
        target instanceof StructureTower ||
        target instanceof StructureSpawn ||
        target instanceof StructureLink ||
		target instanceof StructureContainer ||
	    target instanceof StructureTerminal ||
	    target instanceof StructureStorage ||
	    target instanceof StructureLab) {
            //return target.transferEnergy(this, amount);
			return this.withdraw(target, resource, amount);
    }

    return ERR_INVALID_TARGET;
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
		        console.log('!!!Error: ' + this.name + '(' + this.pos.roomName + ')' + ' has no flag in memory!!!');
		        return;
		    } else {
		        myFlag = Game.flags[this.memory.flagName];
				if(!myFlag) {
					console.log('!!!Error: ' + this.name + '(' + this.pos.roomName + ')' + ' has a flag in memory that doesn\'t exist!!!');
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
		let pickUpStorage = Game.getObjectById('577502e26a7f9a9b428b4568');
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
		let dropOffStorage = Game.getObjectById('574a1a88d8ee13485adf42cd');
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
        this.errorLog('no flag in memory', ERR_NOT_FOUND);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
	        return;
		}
    }

    if(this.pos.roomName === myFlag.pos.roomName) {
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

		if(typeof goal === 'undefined') {
			let foundStructures = this.room.lookForAt(LOOK_STRUCTURES, myFlag.pos);

			if(foundStructures.length && !foundStructures[0].my) {
				goal = foundStructures[0];
			}
		}

		if(goal === undefined) {
			this.log('no more attack targets');
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
			this.errorLog('no path to target', ERR_NO_PATH);
		}

		let nextPos = pathToTarget.path[0];

		let foundStructures = this.room.lookForAt(LOOK_STRUCTURES, nextPos);

		if(foundStructures.length && !foundStructures[0].my) {
			this.dismantle(foundStructures[0]);
		} else {
			this.moveTo(nextPos);
		}

	} else {
		this.moveTo(myFlag);
	}
};

Creep.prototype.runMedic = function() {
	let myFlag;

	if(this.memory.flagName === undefined) {
        this.errorLog('no flag in memory', ERR_NOT_FOUND);
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			this.errorLog('flag is missing', ERR_NOT_FOUND);
	        return;
		}
    }

	let creepLeader = Game.creeps[this.memory.leader];

	if(!creepLeader) {
		let creepLeaders = _.filter(Game.creeps,
				(creep) => {
					return ((creep.memory.flagName === this.memory.flagName) && (creep.memory.role === 'dismantler'));
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
	let myFlag;

    if(this.memory.flagName === undefined) {
        console.log('!!!Error: ' + this.name + ' has no flag in memory!!!');
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
        if(myFlag === undefined) {
			console.log('!!!Error: ' + this.name + '\'s flag is missing!!!');
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
		this.moveTo(destinationRoomPosition);
	}
};

Creep.prototype.runSoldier = function() {
	let myFlag;

    if(this.memory.flagName === undefined) {
        console.log('!!!Error: ' + this.name + ' has no flag in memory!!!');
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
		if(myFlag === undefined) {
			console.log('!!!Error: ' + this.name + '\'s flag is missing!!!');
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
	let myFlag;

    if(this.memory.flagName === undefined) {
        console.log('!!!Error: ' + this.name + ' has no flag in memory!!!');
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
            console.log('!!!Error: ' + this.name + ' (' + this.pos.roomName + ') could not successfully harvest (' + harvestReturn + ')');
        }
    } else {
        this.moveTo(myFlag);
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
        console.log('!!!Error: ' + this.name + ' has no flag in memory!!!');
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
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
		var structuresWithEnergy = this.room.find(FIND_MY_STRUCTURES, {
				filter: (structure) => {
					return ((structure.structureType === STRUCTURE_LINK) && (structure.energy >= (this.carryCapacity / 4))) || ((structure.structureType === STRUCTURE_STORAGE) && (structure.store[RESOURCE_ENERGY] >= 1000));
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
					return ((structure.structureType === STRUCTURE_LINK) && (structure.energy >= this.carryCapacity)) || ((structure.structureType === STRUCTURE_STORAGE) && (structure.store[RESOURCE_ENERGY] >= 1000));
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
		this.moveTo(controllerToReserve);
	}
};

Creep.prototype.runClaimer = function() {
	this.say('claimer');
	// state 0 is head to next room


	let checkPoint1 = new RoomPosition(26, 12, 'E2S29');
	let checkPoint2 = new RoomPosition(26, 12, 'E2S29');
	let checkPoint3 = new RoomPosition(26, 12, 'E2S29');


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
		if(this.claimController(controllerToClaim) === ERR_NOT_IN_RANGE) {
			this.moveTo(controllerToClaim);
		}
	}
};

Creep.prototype.runAttackClaimer = function() {
	this.say('claimer');
	// state 0 is head to next room


	let checkPoint1 = new RoomPosition(21, 5, 'E9S24');
	let checkPoint2 = new RoomPosition(21, 5, 'E9S24');
	let checkPoint3 = new RoomPosition(21, 5, 'E9S24');


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


	var checkPoint1 = new RoomPosition(4, 46, 'E10S23');
	var checkPoint2 = new RoomPosition(15, 3, 'E10S26');
	var checkPoint3 = new RoomPosition(13, 4, 'E9S27');


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
		// upgrade
		if(this.upgradeController(this.room.controller) === ERR_NOT_IN_RANGE) {
			this.moveTo(this.room.controller);
		}
	}
};

Creep.prototype.runRemoteBuilder = function() {
	//this.say('remoteBuilder');
	// state 0 is head to next room


	let checkPoint1 = new RoomPosition(21, 5, 'E9S24');
	let checkPoint2 = new RoomPosition(21, 5, 'E9S24');
	let checkPoint3 = new RoomPosition(21, 5, 'E9S24');


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

Creep.prototype.runMineralCarrier = function() {
	// find mineral transfer job flag for current task

	// filter for room mineral transfer flags
	let roomTransferFlagRegex = new RegExp('^' + this.memory.spawnRoom + '_mineralTransfer_');
	let roomTransferFlags = _.filter(Game.flags, (flag) => roomTransferFlagRegex.test(flag.name) === true);

	if(!roomTransferFlags.length) {
		this.log('no mineral flags left in room');
		return;
	}

	let firstTransferFlag = roomTransferFlags[0];

	let flagMineralReturn = /_mineralTransfer_(.+)/.exec(firstTransferFlag.name);

	if(flagMineralReturn === null) {
		this.errorLog('found mineral transfer flag with no mineral', ERR_NOT_FOUND);
		return;
	}

	let flagMineral = flagMineralReturn[1];

	let flagPosStructures = this.room.lookForAt(LOOK_STRUCTURES, firstTransferFlag);

	if(!flagPosStructures.length) {
		this.errorLog('no lab found under flag (' + firstTransferFlag.name + ')', ERR_NOT_FOUND);
		return;
	}

	// TODO: make this work if a rampart is on top
	let lab = flagPosStructures[0];

	if(lab.structureType !== STRUCTURE_LAB) {
		this.errorLog('found non-lab structure under flag', ERR_NOT_FOUND);
		return;
	}

	if(lab.mineralAmount === lab.mineralCapacity) {
		this.log('lab full, removing flag(' + firstTransferFlag.name + ')');
		firstTransferFlag.remove();
		return;
	}

	if(_.sum(this.carry) > 0) {
		//drop off minerals at lab
		if(this.transfer(lab, flagMineral) === ERR_NOT_IN_RANGE) {
			this.moveTo(lab);
		}
	} else {
		// get minerals from terminal
		if(typeof this.room.terminal === 'undefined') {
			this.errorLog('no terminal', ERR_NOT_FOUND);
			return;
		}

		let transferAmount = Math.min(lab.mineralCapacity - lab.mineralAmount, this.carryCapacity);

		if(this.withdraw(this.room.terminal, flagMineral, transferAmount) === ERR_NOT_IN_RANGE) {
			this.moveTo(this.room.terminal);
		}
	}

};
