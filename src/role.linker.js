/*
 * role.linker
 */

module.exports = {
    run(creep) {
        creep.say('linker');
		// state 0 is get energy from link
	    // state 1 is transfer energy to storage
	    if(creep.memory.state == undefined) {
	        creep.memory.state = 0;
	    }
	    
	    if(creep.carry.energy == creep.carryCapacity) {
			if(creep.memory.state == 0) {
				creep.say('I\'m full!');
			}
	        creep.memory.state = 1;
	    }
	    
	    if (creep.carry.energy == 0) {
			if(creep.memory.state == 1) {
				creep.say('I\'m empty!');
			}
	        creep.memory.state = 0;
	    }
	    
	    if(creep.memory.state == 0) {
	        // find link that isn't empty
			//var closestLink = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
			//		filter: (structure) => {
			//			return (structure.structureType === STRUCTURE_LINK) && (structure.energy >= creep.carryCapacity);
			//		}
			//});
			
			// find storage link
			var closestLink = Game.getObjectById('573a6ed5d32c966b71bd066b');
			
            if(!creep.pos.isNearTo(closestLink)) {
                creep.moveTo(closestLink);
            }
        } else if(creep.memory.state == 1) {
			// transfer energy to storage
			var closestStorage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
			if(creep.transfer(closestStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
				creep.moveTo(closestStorage);
			}
		} else {
			creep.memory.state = 0;
		}
    }
};
