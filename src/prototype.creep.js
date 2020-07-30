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

Creep.prototype.partCount = function(partType) {
	let count = 0;
	for(let part of this.body) {
		if(part.type === partType) {
			count++;
		}
	}
	return count;
};

Creep.prototype.getRefillTarget = function() {
	let targets;

	// only look for spawns and extensions if room is at less than capacity
	if(this.room.energyAvailable < this.room.energyCapacityAvailable) {
		// if room energy is < 300, fill extensions first so spawn can generate energy
		if(this.room.energyAvailable < 300) {
			targets = _.filter(this.room.findStructures(STRUCTURE_EXTENSION), (s) => {
				return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
			});

			if(!isArrayWithContents(targets)) {
				targets = _.filter(this.room.findStructures(STRUCTURE_SPAWN), (s) => {
					return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
				});
			}
		} else {
			targets = _.filter(this.room.findStructures(STRUCTURE_SPAWN).concat(this.room.findStructures(STRUCTURE_EXTENSION)), (s) => {
				return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
			});
		}
	}

	// refill towers if no spawns or extensions need refilling
	if(!isArrayWithContents(targets)) {
		targets = _.filter(this.room.findStructures(STRUCTURE_TOWER), (s) => {
			return s.store.getUsedCapacity(RESOURCE_ENERGY) < s.store.getCapacity(RESOURCE_ENERGY) * 0.95;
		});
	}

	// refill labs if no spawns or extensions or towers need refilling
	if(!isArrayWithContents(targets)) {
		targets = _.filter(this.room.findStructures(STRUCTURE_LAB), (s) => {
			return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
		});
	}

	// refill power spawns
	if(!isArrayWithContents(targets)) {
		targets = _.filter(this.room.findStructures(STRUCTURE_POWER_SPAWN), (s) => {
			return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
		});
	}

	if(isArrayWithContents(targets)) {
		return this.pos.findClosestByRange(targets);
	}
};

/**
 * Have the creep work on a StructureController or ConstructionSite as appropriate
 * @param target - controller or construction site
 * @returns {number}
 */
Creep.prototype.buildOrUpgrade = function(target) {
	if(target instanceof StructureController) {
		return this.upgradeController(target);
	} else if(target instanceof ConstructionSite) {
		return this.build(target);
	}
	return ERR_INVALID_TARGET;
}

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
			return this.withdraw(target, resource, amount);
    }

    return ERR_INVALID_TARGET;
};

Creep.prototype._withdraw = Creep.prototype.withdraw;
/**
 * Overrides the API's creep.withdraw() function to allow consistent transfer code whether the resource holder is
 * a structure or a creep;
 * @param target
 * @param resourceType
 * @param amount
 * @returns {number}
 */
Creep.prototype.withdraw = function(target, resourceType, amount) {
	if(target instanceof Creep) {
		return target.transfer(this, resourceType, amount);
	} else {
		return this._withdraw(target, resourceType, amount);
	}
};

/**
 * Only withdraw from a store-holder if there is enough resource to transfer (or if holder is full), cpu-efficiency effort
 * @param target
 * @param resourceType
 * @returns {number}
 */
// Uses the deprecated "carryCapacity"
// TODO: update to use "store"
// Creep.prototype.withdrawIfFull = function(target, resourceType) {
// 	if(!this.pos.isNearTo(target)) {
// 		return ERR_NOT_IN_RANGE;
// 	}
//
// 	let storageAvailable = this.carryCapacity - _.sum(this.carry);
// 	let targetStorageAvailable = target.storeCapacity - _.sum(target.store);
// 	if(target.store[resourceType] >= storageAvailable || targetStorageAvailable === 0) {
// 		return this.withdraw(target, resourceType);
// 	} else {
// 		return ERR_NOT_ENOUGH_RESOURCES;
// 	}
// };

Creep.prototype.withdrawEverything = function (target) {
	for(let resourceType in target.store) {
		let amount = target.store[resourceType];
		if(amount > 0) {
			return this.withdraw(target, resourceType);
		}
	}
	return ERR_NOT_ENOUGH_RESOURCES;
};

// Uses the deprecated "carry"
// TODO: update to use "store"
// Creep.prototype.transferEverything = function (target) {
// 	for(let resourceType in this.carry) {
// 		let amount = this.carry[resourceType];
// 		if(amount > 0) {
// 			return this.transfer(target, resourceType);
// 		}
// 	}
// 	return ERR_NOT_ENOUGH_RESOURCES;
// };

// TODO: ensure optimal usage of new "store"
Creep.prototype.hasLoad = function() {
	if(this.memory.hasLoad && this.store.getUsedCapacity() === 0) {
		this.memory.hasLoad = false;
	} else if(!this.memory.hasLoad && this.store.getUsedCapacity() === this.store.getCapacity()) {
		this.memory.hasLoad = true;
	}
	return this.memory.hasLoad;
};

/**
 * Find a structure, cache, and invalidate cache based on the functions provided
 * @param findStructure
 * @param forget
 * @param immediate
 * @param prop
 * @returns {Structure}
 */
//Creep.prototype.rememberStructure = function(findStructure: () => Structure, forget: (structure: Structure) => boolean, prop = "remStructureId", immediate = false): Structure {
Creep.prototype.rememberStructure = function(findStructure, forget, prop = "remStructureId", immediate = false) {
	if(this.memory[prop]) {
		let structureId = this.memory[prop];
		let structure = Game.structures[structureId];
		if(!structure) {
			structure = Game.constructionSites[structureId];
		}
		if(!structure) {
			structure = Game.getObjectById(structureId);
		}
		if(structure && !forget(structure)) {
			return structure;
		} else {
			this.memory[prop] = undefined;
			return this.rememberStructure(findStructure, forget, prop, true);
		}
	} else if (Game.time % 9 === 0 || immediate) {
		let object = findStructure();
		if(object) {
			this.memory[prop] = object.id;
			return object;
		}
	}
};

/**
 * Find a creep, cache, and invalidate cache based on the functions provided
 * @param findCreep
 * @param forget
 * @returns {Structure}
 */
//Creep.prototype.rememberCreep = function(findCreep: () => Creep, forget: (creep: Creep) => boolean): Creep {
Creep.prototype.rememberCreep = function(findCreep, forget) {
	if(this.memory.remCreepId) {
		let creep = Game.getObjectById(this.memory.remCreepId);
		if(creep && !forget(creep)) {
			return creep;
		} else {
			this.memory.remCreepId = undefined;
			return this.rememberCreep(findCreep, forget);
		}
	} else {
		let object = findCreep();
		if (object) {
			this.memory.remCreepId = object.id;
			return object;
		}
	}
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
	let offRoad = this.pos.lookForStructure(STRUCTURE_ROAD) === undefined;
	let offContainer = this.pos.lookForStructure(STRUCTURE_CONTAINER) === undefined;
	if(offRoad && offContainer) {
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
	let offContainer = this.pos.lookForStructure(STRUCTURE_CONTAINER) === undefined;
	if(offRoad && offContainer) {
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
		if(position.lookForStructure(STRUCTURE_ROAD) || position.lookForStructure(STRUCTURE_CONTAINER)) {
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

Creep.prototype.fleeHostiles = function(pathFinding) {
	if(!this.fleeObjects) {
		let lairs = this.room.findStructures(STRUCTURE_KEEPER_LAIR);
		let fleeObjects = lairs.length > 0 ? this.room.hostilesAndLairs : this.room.hostiles;

		this.fleeObjects = _.filter(fleeObjects, (c) => {
			if(c instanceof Creep) {
				return _.find(c.body, (part) => {
						return part.type === ATTACK || part.type === RANGED_ATTACK;
					}) !== null;
			} else {
				return true;
			}
		});
	}

	if(this.fleeObjects.length === 0) {
		return false;
	}

	let closest = this.pos.findClosestByRange(this.fleeObjects);
	if(closest) {
		let range = this.pos.getRangeTo(closest);
		if(range < 3 && this.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && closest instanceof Creep) {
			// TODO: make it drop all resources
			this.drop(RESOURCE_ENERGY);
		}

		let fleeRange = closest.owner.username === "Source Keeper" ? 5 : 8;

		if(range < fleeRange) {
			if(pathFinding) {
				this.fleeByPath(closest);
			} else {
				let fleePosition = this.pos.bestFleePosition(closest);
				if(fleePosition) {
					this.move(this.pos.getDirectionTo(fleePosition));
				}
			}
			return true;
		}
	}
	return false;
};

Creep.prototype.fleeByPath = function(roomObject) {
	let avoidPositions = _.map(this.pos.findInRange(this.room.hostiles, 5), (c) => { return {pos: c.pos, range: 10 }; });

	let ret = PathFinder.search(this.pos, avoidPositions, {
		flee: true,
		maxRooms: 1,
		roomCallback: (roomName) => {
			if(roomName !== this.room.name) {
				return;
			}
			if(!this.room.structureMatrix) {
				let matrix = new PathFinder.CostMatrix();
				addStructuresToMatrix(matrix, this.room);
				this.room.structureMatrix = matrix;
			}
			return this.room.structureMatrix;
		}
	});
	return this.move(this.pos.getDirectionTo(ret.path[0]));
};
