/* jshint esversion: 6 */
/*
 * role.miner
 */

module.exports = {
    run(creep) {
        //creep.say('miner');
		// state 0 is harvest
	    // state 1 is transfer energy
	    if(creep.memory.state === undefined) {
	        creep.memory.state = 0;
	    }

	    if(creep.carry.energy == creep.carryCapacity) {
			if(creep.memory.state === 0) {
				creep.say('I\'m full!');
			}
	        creep.memory.state = 1;
	    }

	    if (creep.carry.energy === 0) {
			if(creep.memory.state == 1) {
				creep.say('I\'m empty!');
			}
	        creep.memory.state = 0;
	    }

	    if(creep.memory.state === 0) {
            // harvest
            var closestSource = creep.pos.findClosestByPath(FIND_SOURCES);
            var harvestReturn = creep.harvest(closestSource);
            if (harvestReturn === ERR_NOT_IN_RANGE) {
                creep.moveTo(closestSource);
            } else if(harvestReturn === OK) {
                if((creep.memory.spawnRoom === 'E9S27') && (creep.pos.y !== 36) && (creep.pos.y !== 35)) {
                    creep.move(TOP);
                }
            }
  		} else if(creep.memory.state == 1) {
  			// transfer to storage
  			var closestStorage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
  			if(creep.transfer(closestStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
  				creep.moveTo(closestStorage);
  			}
      } else {
  			creep.memory.state = 0;
  		}
    }
};
