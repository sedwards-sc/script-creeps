/*
 * role.explorer
 */

module.exports = {
	run(creep) {
		//creep.say('explorer');
		// state 0 is head to next room
		// state 1 harvest
		
		if(creep.memory.state == undefined) {
			creep.memory.state = 0;
		}

		console.log(creep.pos);
		
		if(creep.memory.state == 0)
			creep.moveTo(new RoomPosition(5, 7, 'E22S1'));
		}
	}
};
