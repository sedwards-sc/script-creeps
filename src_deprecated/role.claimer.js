/* jshint esversion: 6 */
/*
 * role.claimer
 */

module.exports = {
	run(creep) {
		creep.say('claimer');
		// state 0 is head to next room


		let checkPoint1 = new RoomPosition(34, 9, 'E7S24');
		let checkPoint2 = new RoomPosition(34, 9, 'E7S24');
		let checkPoint3 = new RoomPosition(34, 9, 'E7S24');


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

		if((creep.memory.state === 2) && (JSON.stringify(creep.pos) === JSON.stringify(checkPoint3))) {
		    creep.say('chkpt 3');
			creep.memory.state = 3;
		}

		if(creep.memory.state === 0) {
			creep.moveTo(checkPoint1);
		} else if(creep.memory.state === 1) {
			creep.moveTo(checkPoint2);
		} else if(creep.memory.state === 2) {
			creep.moveTo(checkPoint3);
		} else if(creep.memory.state === 3) {
	        var controllerToClaim = creep.room.controller;
			if(creep.claimController(controllerToClaim) === ERR_NOT_IN_RANGE) {
				creep.moveTo(controllerToClaim);
			}
        }
	}
};
