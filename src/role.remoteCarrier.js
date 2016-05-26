/*
 * role.remoteCarrier
 */

module.exports = {
	run(creep) {
		//creep.say('rCarrier');
		// state 0 is head to next room
		// state 1 harvest
		// state 2 is head back to home room
		// state 3 is upgrade controller
		
		if(creep.memory.positionState === undefined) {
			creep.memory.positionState = 0;
		}
		
		//var checkPointHome = new RoomPosition(13, 11, 'E8S23');
		var checkPointHome = new RoomPosition(2, 25, 'E8S23');
		var checkPointAway = new RoomPosition(48, 32, 'E7S23');
		
		if(creep.memory.positionState === 0) {
			checkPointAway = new RoomPosition(45, 28, 'E7S23');
		} else {
			checkPointAway = new RoomPosition(48, 34, 'E7S23');
		}
		
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
			if(creep.memory.positionState === 0) {
				creep.memory.positionState = 1;
			} else if(creep.memory.positionState === 1) {
				creep.memory.positionState = 0;
			}
	    }
		
		
		if(creep.memory.state === 0) {
			creep.moveTo(checkPointAway);
		} else if(creep.memory.state === 1) {
	        // harvest
			var closestEnergy = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
					filter: (pile) => {
						return pile.energy >= creep.carryCapacity;
					}
			});
			
            if(creep.pickup(closestEnergy) === ERR_NOT_IN_RANGE) {
                creep.moveTo(closestEnergy);
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
