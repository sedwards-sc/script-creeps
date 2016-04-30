/*
 * role.explorer
 */

module.exports = {
	run(creep) {
		//creep.say('explorer');
		// state 0 is head to next room
		// state 1 harvest
		// state 2 is head back to home room
		// state 3 is upgrade controller
		
		var checkPointAway = new RoomPosition(5, 7, 'E22S1');
		var checkPointHome = new RoomPosition(45, 23, 'E21S1');
		
		if(creep.memory.state === undefined) {
			creep.memory.state = 0;
		}

		if((creep.memory.state === 0) && (JSON.stringify(creep.pos) === JSON.stringify(checkPointAway))) {
		    console.log('checkpoint away reached');
			creep.memory.state = 1;
		}
		
		if((creep.memory.state === 1) && (creep.carry.energy === creep.carryCapacity)) {
			creep.say('capacity full');
	        creep.memory.state = 2;
	    }

		if((creep.memory.state === 2) && (JSON.stringify(creep.pos) === JSON.stringify(checkPointHome))) {
		    console.log('checkpoint home reached');
			creep.memory.state = 3;
		}
		
		if ((creep.memory.state === 3) && (creep.carry.energy === 0)) {
			creep.say('capacity empty');
	        creep.memory.state = 0;
	    }
		
		
		if(creep.memory.state === 0) {
			creep.moveTo(checkPointAway);
		} else if(creep.memory.state === 1) {
	        // harvest
            var closestSource = creep.pos.findClosestByPath(FIND_SOURCES);
            if(creep.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                creep.moveTo(closestSource);
            }
        } else if(creep.memory.state === 2) {
			creep.moveTo(checkPointHome);
		} else if(creep.memory.state === 3) {
			// upgrade
			if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
				creep.moveTo(creep.room.controller);
			}
		}
	}
};
