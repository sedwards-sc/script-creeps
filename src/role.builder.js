/*
 * role.builder
 */

module.exports = {
	run(creep) {
        // state 0 is harvest
        // state 1 is work
        
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
            // work
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {
                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            } else {
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                }
            }
        }
	    
/*
	    if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
	    }
	    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.building = true;
	    }

	    if(creep.memory.building) {
	        console.log("building");
	        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {
                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            } else {
                creep.memory.building = false;
                console.log("set false");
            }
	    } else {
	        console.log("test");
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
    	        var sources = creep.room.find(FIND_SOURCES);
                if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[0]);
                }
	        } else {
                //upgrade
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                }
	        }
	    }
*/

	}
};

/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.builder');
 * mod.thing == 'a thing'; // true
 */