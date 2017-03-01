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

/**
 * General-purpose cpu-efficient movement function that uses ignoreCreeps: true, a high reusePath value and stuck-detection
 * @param destination
 * @param ops - pathfinding ops, ignoreCreeps and reusePath will be overwritten
 * @param dareDevil
 * @returns {number} - Error code
 */
Creep.prototype.blindMoveTo = function(destination, ops, dareDevil = false) {

	if(this.spawning) {
		return 0;
	}

	if(this.fatigue > 0) {
		return ERR_TIRED;
	}

	if(!this.memory.position) {
		this.memory.position = this.pos;
	}

	if(!ops) {
		ops = {};
	}

	// check if trying to move last tick
	let movingLastTick = true;
	if(!this.memory.lastTickMoving) {
		this.memory.lastTickMoving = 0;
	}
	if(Game.time - this.memory.lastTickMoving > 1) {
		movingLastTick = false;
	}
	this.memory.lastTickMoving = Game.time;

	// check if stuck
	let stuck = this.pos.inRangeTo(this.memory.position.x, this.memory.position.y, 0);
	this.memory.position = this.pos;
	if(stuck && movingLastTick) {
		if(!this.memory.stuckCount) {
			this.memory.stuckCount = 0;
		}
		this.memory.stuckCount++;
		if(dareDevil && this.memory.stuckCount > 0) {
			this.memory.detourTicks = 5;
		} else if (this.memory.stuckCount >= 2) {
			this.memory.detourTicks = 5;
			// this.say("excuse me", true);
		}
		if(this.memory.stuckCount > 500 && !this.memory.stuckNoted) {
			this.errorLog("stuck at " + JSON.stringify(this.pos) + ", stuckCount: " + this.memory.stuckCount, ERR_NO_PATH, 5);
			this.memory.stuckNoted = true;
		}
	} else {
		this.memory.stuckCount = 0;
	}

	if(this.memory.detourTicks > 0) {
		this.memory.detourTicks--;
		if(dareDevil) {
			ops.reusePath = 0;
		} else {
			ops.reusePath = 5;
		}
		return this.moveTo(destination, ops);
	} else {
		ops.reusePath = 50;
		ops.ignoreCreeps = true;
		return this.moveTo(destination, ops);
	}
};

/**
 * another function for keeping roads clear, this one is more useful for builders and road repairers that are
 * currently working, will move off road without going out of range of target
 * @param target - target for which you do not want to move out of range
 * @param allowSwamps
 * @returns {number}
 */
Creep.prototype.yieldRoad = function(target, allowSwamps = true) {
	let isOffRoad = this.pos.lookForStructure(STRUCTURE_ROAD) === undefined;
	if(isOffRoad) {
		return OK;
	}

	let swampPosition;
	// find movement options
	let direction = this.pos.getDirectionTo(target);
	for(let i = -2; i <= 2; i++) {
		let relDirection = direction + i;
		relDirection = clampDirection(relDirection);
		let position = this.pos.getPositionAtDirection(relDirection);
		if(!position.inRangeTo(target, 3)) {
			continue;
		}
		if(position.lookFor(LOOK_STRUCTURES).length > 0) {
			continue;
		}
		if(!position.isPassible()) {
			continue;
		}
		if(position.isNearExit(0)) {
			continue;
		}
		if(position.lookFor(LOOK_TERRAIN)[0] === "swamp") {
			swampPosition = position;
			continue;
		}
		return this.move(relDirection);
	}
	if (swampPosition && allowSwamps) {
		return this.move(this.pos.getDirectionTo(swampPosition));
	}
	return this.blindMoveTo(target);
};

/**
 * Can be used to keep idling creeps out of the way, like when a road repairer doesn't have any roads needing repair
 * or a spawn refiller who currently has full extensions. Clear roads allow for better creep.BlindMoveTo() behavior
 * @param defaultPoint
 * @param maintainDistance
 * @returns {any}
 */
Creep.prototype.idleOffRoad = function(defaultPoint, maintainDistance = false) {
	let offRoad = this.pos.lookForStructure(STRUCTURE_ROAD) === undefined;
	if(offRoad) {
		return OK;
	}

	/*
	if (this.memory.idlePosition) {
		let pos = helper.deserializeRoomPosition(this.memory.idlePosition);
		if (!this.pos.inRangeTo(pos, 0)) {
			return this.moveItOrLoseIt(pos);
		}
		return OK;
	}
	*/

	let positions = _.sortBy(this.pos.openAdjacentSpots(), (p) => p.getRangeTo(defaultPoint));
	if(maintainDistance) {
		let currentRange = this.pos.getRangeTo(defaultPoint);
		positions = _.filter(positions, (p) => p.getRangeTo(defaultPoint) <= currentRange);
	}
	let swampPosition;
	for(let position of positions) {
		if(position.lookForStructure(STRUCTURE_ROAD)) {
			continue;
		}
		let terrain = position.lookFor(LOOK_TERRAIN)[0];
		if(terrain === "swamp") {
			swampPosition = position;
		} else {
			return this.move(this.pos.getDirectionTo(position));
		}
	}

	if(swampPosition) {
		return this.move(this.pos.getDirectionTo(swampPosition));
	}

	return this.blindMoveTo(defaultPoint);
};
