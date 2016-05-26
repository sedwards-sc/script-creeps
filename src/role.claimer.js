/*
 * role.claimer
 */

module.exports = {
	run(creep) {
		creep.say('claimer');
		// state 0 is head to next room

		
		var checkPoint1 = new RoomPosition(4, 46, 'E10S23');
		var checkPoint2 = new RoomPosition(15, 3, 'E10S26');
		
		
		if(creep.memory.state === undefined) {
			creep.memory.state = 0;
		}

		if((creep.memory.state === 0) && (JSON.stringify(creep.pos) === JSON.stringify(checkPoint1))) {
		    creep.say('chkpt 1');
			creep.memory.state = 1;
		}

		if((creep.memory.state === 1) && (JSON.stringify(creep.pos) === JSON.stringify(checkPoint2))) {
		    creep.say('chkpt 2');
			creep.memory.state = 2;
		}
		
		if(creep.memory.state === 0) {
			creep.moveTo(checkPoint1);
		} else if(creep.memory.state === 1) {
			creep.moveTo(checkPoint2);
		} else if(creep.memory.state === 2) {
	        var controllerToClaim = Game.getObjectById('55db3356efa8e3fe66e05765');
			if(creep.claimController(controllerToClaim) === ERR_NOT_IN_RANGE) {
				creep.moveTo(controllerToClaim);
			}
        }
	}
};
