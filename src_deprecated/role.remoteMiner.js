/* jshint esversion: 6 */
/*
 * role.remoteMiner
 */

module.exports = {
    run(creep) {
		//creep.say('rMiner');
		// state 0 is head to next room
		// state 1 harvest

		if((creep.memory.rRoomName === undefined) || (creep.memory.rX === undefined) || (creep.memory.rY === undefined)) {
			return;
		}

		//var checkPointAway = new RoomPosition(48, 31, 'E7S23');

		var checkPointAway = new RoomPosition(creep.memory.rX, creep.memory.rY, creep.memory.rRoomName);

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
			var mySource;
			if(creep.memory.remoteMine === undefined) {
				mySource = creep.pos.findClosestByPath(FIND_SOURCES);
			} else {
				mySource = creep.room.find(FIND_SOURCES)[creep.memory.remoteMine];
			}
			if(creep.harvest(mySource) === ERR_NOT_IN_RANGE) {
				creep.moveTo(mySource);
			}
        }
    }
};

//var sourceTest = Game.getObjectById('55db333cefa8e3fe66e056d7');
