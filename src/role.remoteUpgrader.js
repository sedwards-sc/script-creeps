/*
 * role.remoteUpgrader
 */

module.exports = {
	run(creep) {
		creep.say('claimer');
		// state 0 is head to next room

		
		var checkPoint1 = new RoomPosition(4, 46, 'E10S23');
		var checkPoint2 = new RoomPosition(15, 3, 'E10S26');
		var checkPoint3 = new RoomPosition(13, 4, 'E9S27');
		
		
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
		
		if((creep.memory.state === 3) && (creep.carry.energy === creep.carryCapacity)) {
	        creep.memory.state = 4;
	    }
	    
	    if ((creep.memory.state === 4) && (creep.carry.energy === 0)) {
	        creep.memory.state = 3;
	    }
		
		if(creep.memory.state === 0) {
			creep.moveTo(checkPoint1);
		} else if(creep.memory.state === 1) {
			creep.moveTo(checkPoint2);
		} else if(creep.memory.state === 2) {
			creep.moveTo(checkPoint3);
		} else if(creep.memory.state === 3) {
			// harvest
	        var sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0]);
            }
        } else if(creep.memory.state === 4) {
			// upgrade
            if(creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
		}
	}
};

