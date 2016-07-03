/* jshint esversion: 6 */
/*
 * role.builder
 */

module.exports = {
	run(creep) {
        // state 0 is harvest
        // state 1 is work

        if(creep.memory.state === undefined) {
            creep.memory.state = 0;
        }

        if(creep.carry.energy === creep.carryCapacity) {
	        creep.memory.state = 1;
	    }

	    if (creep.carry.energy === 0) {
	        creep.memory.state = 0;
	    }

	    if(creep.memory.state === 0) {
	        // get energy piles
			var droppedEnergy = creep.room.find(FIND_DROPPED_ENERGY, {
					filter: (pile) => {
						return (pile.energy >= (creep.carryCapacity / 2)) && (pile.pos.roomName === creep.memory.spawnRoom);
					}
			});

			//get links with energy or storage with enough surplus energy
			var structuresWithEnergy = creep.room.find(FIND_MY_STRUCTURES, {
					filter: (structure) => {
						return ((structure.structureType === STRUCTURE_LINK) && (structure.energy >= creep.carryCapacity)) || ((structure.structureType === STRUCTURE_STORAGE) && (structure.store[RESOURCE_ENERGY] >= 1000));
					}
			});

			var energySources = [];

			for(let i in droppedEnergy) {
				energySources.push(droppedEnergy[i]);
			}

			for(let i in structuresWithEnergy) {
				energySources.push(structuresWithEnergy[i]);
			}

			var closestEnergy = creep.pos.findClosestByPath(energySources);

			if(closestEnergy) {
				if((closestEnergy.structureType === STRUCTURE_LINK) || (closestEnergy.structureType === STRUCTURE_STORAGE)) {
					if(!creep.pos.isNearTo(closestEnergy)) {
						creep.moveTo(closestEnergy);
					}
				} else {
					if(creep.pickup(closestEnergy) === ERR_NOT_IN_RANGE) {
						creep.moveTo(closestEnergy);
					}
				}
			} else {
				creep.say('no energy');
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
