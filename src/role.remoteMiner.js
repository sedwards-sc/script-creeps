/*
 * role.remoteMiner
 */

module.exports = {
    run(creep) {
		//creep.say('rMiner');
		// state 0 is head to next room
		// state 1 harvest
		
		var checkPointAway = new RoomPosition(48, 31, 'E7S23');
		
		if(creep.memory.state === undefined) {
			creep.memory.state = 0;
		}

		if((creep.memory.state === 0) && (JSON.stringify(creep.pos) === JSON.stringify(checkPointAway))) {
		    creep.say('away pt');
			creep.memory.state = 1;
		}
		
		
		if(creep.memory.state === 0) {
			creep.moveTo(checkPointAway);
		} else if(creep.memory.state === 1) {
	        // harvest
			if(creep.memory.remoteMine === undefined) {
				var mySource = creep.pos.findClosestByPath(FIND_SOURCES);
			} else {
				var mySource = creep.room.find(FIND_SOURCES)[creep.memory.remoteMine];
			}
			if(creep.harvest(mySource) === ERR_NOT_IN_RANGE) {
				creep.moveTo(mySource);
			}
        }
    }
};

//var sourceTest = Game.getObjectById('55db333cefa8e3fe66e056d7');
