/*
 * role.harvester
 */

module.exports = {
	run(creep) {
	    // state 0 is harvest
	    // state 1 is transfer energy
	    if(creep.memory.state == undefined) {
	        creep.memory.state = 0;
	    }
	    
	    if(creep.carry.energy == creep.carryCapacity) {
			if(creep.memory.state == 0) {
				creep.say('I\'m full!');
			}
	        creep.memory.state = 1;
	    }
	    
	    if (creep.carry.energy == 0) {
			if(creep.memory.state == 1) {
				creep.say('I\'m empty!');
			}
	        creep.memory.state = 0;
	    }
	    
	    if(creep.memory.state == 0) {
	        // harvest
			// TODO: find closest source
	        //var source = creep.pos.findClosestByPath
            var sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[1]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[1]);
            }
        } else {
            // transfer energy
            
			var closestExtensionTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType == STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity;
					}
			});

            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                    }
            });
            
            if(closestExtensionTarget) {
                if(creep.transfer(closestExtensionTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestExtensionTarget);
                }
            } else if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            } else {
                // build
                var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                if(targets.length) {
                    if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targets[0]);
                    }
                } else {
                    // else upgrade
                    if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller);
                    }
                }
            }
        }
	}
};

/*
             var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                    }
            });
*/

/*
            var extensionTargets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity;
                    }
            });
*/