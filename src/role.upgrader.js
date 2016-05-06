/*
 * role.upgrader
 */

module.exports = {
	run(creep) {
	    // state 0 is harvest
	    // state 1 is upgrade
	    
	    if(creep.memory.state == undefined) {
	        creep.memory.state = 0;
	    }
	    
	    if(creep.carry.energy == creep.carryCapacity) {
	        creep.memory.state = 1;
	    }
	    
	    if (creep.carry.energy == 0) {
	        creep.memory.state = 0;
	    }
	    
	    if(creep.memory.state == 0) {
	        // get energy
            var droppedEnergy = creep.room.findClosestByRange(FIND_DROPPED_ENERGY);
			if(droppedEnergy.length >= 1) {
				if(creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE) {
					creep.moveTo(droppedEnergy[0]);
				}
			}
        } else {
            // upgrade
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
	}
};

/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.upgrader');
 * mod.thing == 'a thing'; // true
 */