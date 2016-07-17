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
	} else if(this.memory.role === 'reinforcer') {
		this.runReinforcer();
    } else if(this.memory.role === 'mineralHarvester') {
        this.runMineralHarvester();
	} else if(this.memory.role === 'remoteMiner') {
		this.runRemoteMiner2();
	} else if(this.memory.role === 'remoteCarrier') {
		this.runRemoteCarrier2();
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
		let roomStorage = this.room.storage;
		if(this.withdraw(roomStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
			this.moveTo(roomStorage);
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
            //return target.transfer(this, resource, amount);
			return this.withdraw(target, resource, amount);
    }

    if (target instanceof StructurePowerSpawn ||
        target instanceof StructureExtension ||
        target instanceof StructureTower ||
        target instanceof StructureSpawn ||
        target instanceof StructureLink) {
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
            console.log('!!!Error: ' + this.name + ' could not successfully harvest (' + harvestReturn + ')');
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
