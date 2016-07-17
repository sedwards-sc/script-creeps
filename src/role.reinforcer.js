/* jshint esversion: 6 */
/*
 * role.reinforcer
 */

module.exports = {
    run(creep) {
        //creep.say('reinforcer');
		// state 0 is get energy from storage
	    // state 1 is repair a wall/rampart
	    if(creep.memory.state === undefined) {
	        creep.memory.state = 0;
	    }

	    if(creep.carry.energy === creep.carryCapacity) {
			if(creep.memory.state === 0) {
				creep.say('I\'m full!');

				var defences = creep.room.find(FIND_STRUCTURES, {
						filter: (structure) => {
							return ((structure.structureType === STRUCTURE_WALL) || (structure.structureType === STRUCTURE_RAMPART)) && structure.hits < structure.hitsMax;
						}
				});
				var sortedDefences = _.sortBy(defences, function(defence) { return defence.hits; });
				creep.memory.repairId = sortedDefences[0].id;
			}
	        creep.memory.state = 1;
	    }

	    if (creep.carry.energy === 0) {
			if(creep.memory.state === 1) {
				creep.say('I\'m empty!');
			}
	        creep.memory.state = 0;
	    }

	    if(creep.memory.state === 0) {
	        // find storage
            var closestStorage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
            if(!creep.pos.isNearTo(closestStorage)) {
                creep.moveTo(closestStorage);
            }
        } else if(creep.memory.state === 1) {
			// repair walls/ramparts
			if(creep.memory.repairId === undefined) {
				var defences = creep.room.find(FIND_STRUCTURES, {
						filter: (structure) => {
							return ((structure.structureType === STRUCTURE_WALL) || (structure.structureType === STRUCTURE_RAMPART)) && structure.hits < structure.hitsMax;
						}
				});
				var sortedDefences = _.sortBy(defences, function(defence) { return defence.hits; });
				creep.memory.repairId = sortedDefences[0].id;
			}

			var currentDefence = Game.getObjectById(creep.memory.repairId);

			if(creep.repair(currentDefence) === ERR_NOT_IN_RANGE) {
				creep.moveTo(currentDefence);
			}
		} else {
			creep.memory.state = 0;
		}
    }
};
