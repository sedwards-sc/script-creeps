/* jshint esversion: 6 */
/*
 * prototype.creep
 */

Creep.prototype.run = function() {
	if(this.memory.role === 'carrier') {
		this.runCarrier();
    } else if(this.memory.role === 'mineralHarvester') {
        this.runMineralHarvester();
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
