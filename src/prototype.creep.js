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
		this.runLinker2();
    } else if(this.memory.role === 'mineralHarvester') {
        this.runMineralHarvester();
	} else if(this.memory.role === 'specialCarrier') {
		this.runSpecialCarrier();
	} else if(this.memory.role === 'dismantler') {
		this.runDismantler();
	} else if(this.memory.role === 'scout') {
		this.runScout();
	} else if(this.memory.role === 'soldier') {
		this.runSoldier();
    } else {
        console.log('!!!Error: creep ' + this.name + ' has no role function!!!');
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
		// find storage
		var roomStorage = this.room.storage;
		if(!this.pos.isNearTo(roomStorage)) {
			this.moveTo(roomStorage);
		}
	} else if(this.memory.state == 1) {
		// transfer energy to structures
		var closestTarget = this.getRefillTarget();

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
	var closestTarget;

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
            console.log('!!!Error: ' + this.name + ' could not successfully harvest (' + harvestReturn + ')');
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
                console.log('!!!Error: ' + this.name + ' could not successfully transfer (' + transferReturn + ')');
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
		}
    } else {
        this.moveTo(myFlag);
    }
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

    if (target instanceof StructureContainer ||
        target instanceof StructureTerminal ||
        target instanceof StructureStorage ||
        target instanceof StructureLab ||
        target instanceof Creep) {
            return target.transfer(this, resource, amount);
    }

    if (target instanceof StructurePowerSpawn ||
        target instanceof StructureExtension ||
        target instanceof StructureTower ||
        target instanceof StructureSpawn ||
        target instanceof StructureLink) {
            return target.transferEnergy(this, amount);
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

Creep.prototype.runScout = function() {
	let myFlag;

    if(this.memory.flagName === undefined) {
        console.log('!!!Error: ' + this.name + ' has no flag in memory!!!');
        return;
    } else {
        myFlag = Game.flags[this.memory.flagName];
    }

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
    }

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
