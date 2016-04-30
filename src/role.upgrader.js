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
	        // harvest
            var sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0]);
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