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
		
		var checkPointAway = new RoomPosition(31, 29, 'E9S23');
		var checkPointHome = new RoomPosition(47, 9, 'E8S23');
		
		if(creep.memory.state === undefined) {
			creep.memory.state = 0;
		}

		if((creep.memory.state === 0) && (JSON.stringify(creep.pos) === JSON.stringify(checkPointAway))) {
		    creep.say('away pt');
			creep.memory.state = 1;
		}
		
		if((creep.memory.state === 1) && (creep.carry.energy === creep.carryCapacity)) {
			creep.say('full');
	        creep.memory.state = 2;
	    }

		if((creep.memory.state === 2) && (JSON.stringify(creep.pos) === JSON.stringify(checkPointHome))) {
		    creep.say('home pt');
			creep.memory.state = 3;
		}
		
		if ((creep.memory.state === 3) && (creep.carry.energy === 0)) {
			creep.say('empty');
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
			// transfer to link if there is one that isn't full
			var closestLink = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType === STRUCTURE_LINK) && (structure.energy < structure.energyCapacity);
					}
			});
			
			if(closestLink) {
				if(creep.transfer(closestLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
					creep.moveTo(closestLink);
				}
			} else {
				//drop energy
				creep.drop(RESOURCE_ENERGY);
			}
		}
	}
};

// work
//var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
//if(targets.length) {
//	if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
//		creep.moveTo(targets[0]);
//	}
//} else {
//	if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
//		creep.moveTo(creep.room.controller);
//	}
//}

