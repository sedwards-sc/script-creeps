/* jshint esversion: 6 */
/*
 * prototype.creep
 */

Creep.prototype.toString = function(htmlLink = true){
	return `[${(this.name ? this.name : this.id)} ${this.pos.toString(htmlLink, this.id, 'creeps.'+this.name)}]`;
};

Creep.prototype.descriptionString = function() {
	return `${roomLink(this, this.name)} (${this.room.name}, ${this.memory.role})`;
};

Creep.prototype.log = function(msg, severity = 2) {
	return Logger.log(`creep: ${this.descriptionString()}, msg: ${msg}`, severity);
};

Creep.prototype.errorLog = function(msg, errCode = -10, severity = 3) {
	return Logger.log(`!!!Error!!! creep: ${this.descriptionString()}, msg: ${msg} (${errorCodeToText(errCode)})`, severity);
};

Creep.prototype.getBoosted = function(bodyPartToBoost, resourceToBoost) {
	//this.log('getting boosted');

	let allBoosted = true;

	for(let i in this.body) {
		if(this.body[i].type === bodyPartToBoost && typeof this.body[i].boost === 'undefined') {
			allBoosted = false;
		}
	}

	if(allBoosted === true) {
		this.memory.boosted = true;
		return OK;
	}

	//this.errorLog('not all body parts boosted', ERR_NO_BODYPART);

	let labsWithBoost = Game.rooms[this.room.name].find(FIND_MY_STRUCTURES, {
		filter: (structure) => {
			return (structure.structureType === STRUCTURE_LAB) && (structure.mineralType === resourceToBoost) && (structure.mineralAmount >= LAB_BOOST_MINERAL);
		}
	});

	if(!isArrayWithContents(labsWithBoost)) {
		//this.errorLog('could not find lab with required boost resource', ERR_NOT_FOUND);
		return OK;
	}

	let boostReturn = labsWithBoost[0].boostCreep(this);

	if(boostReturn === ERR_NOT_IN_RANGE) {
		this.moveTo(labsWithBoost[0]);
	}

	return boostReturn;
};

Creep.prototype.getRefillTarget = function() {
	let closestTarget;

	if(this.room.energyAvailable < this.room.energyCapacityAvailable) {
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

	// refill power spawns
	if(!closestTarget) {
		closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType === STRUCTURE_POWER_SPAWN) && structure.energy < structure.energyCapacity;
				}
		});
	}

	// top up terminal if no spawns or extensions or towers or labs need refilling
	//if(!closestTarget) {
	//	if(this.room.terminal && (this.room.terminal.store.energy < this.room.terminal.getResourceQuota(RESOURCE_ENERGY))) {
	//		closestTarget = this.room.terminal;
	//	}
	//}

	return closestTarget;
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

Creep.prototype.hasLoad = function() {
	if(this.memory.hasLoad && _.sum(this.carry) === 0) {
		this.memory.hasLoad = false;
	} else if(!this.memory.hasLoad && _.sum(this.carry) === this.carryCapacity) {
		this.memory.hasLoad = true;
	}
	return this.memory.hasLoad;
};
