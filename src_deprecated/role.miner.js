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
			var mySource;

			if(creep.memory.mySourceId === undefined) {
				mySource = creep.pos.findClosestByRange(FIND_SOURCES);
				creep.memory.mySourceId = mySource.id;
			} else {
				mySource = Game.getObjectById(creep.memory.mySourceId);
				if(mySource === null) {
					delete creep.memory.mySourceId;
				}
			}

			if(mySource) {
				var harvestReturn = creep.harvest(mySource);
	            if (harvestReturn === ERR_NOT_IN_RANGE) {
	                creep.moveTo(mySource);
	            } else if(harvestReturn === OK) {
	                if((creep.memory.spawnRoom === 'E9S27') && (creep.pos.y !== 36) && (creep.pos.y !== 35)) {
	                    creep.move(TOP);
	                }
	            }
			}
		} else if(creep.memory.state == 1) {
  			// transfer to storage or drop
  			var roomStorage = creep.room.storage;
			if(roomStorage) {
				if(creep.transfer(roomStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
	  				creep.moveTo(roomStorage);
	  			}
			} else {
				creep.drop(RESOURCE_ENERGY);
			}
		} else {
  			creep.memory.state = 0;
  		}
    }
};
