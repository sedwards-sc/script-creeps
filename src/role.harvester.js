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
            if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0]);
            }
        } else {
            // transfer energy
            
			var closestTarget;

			// if room energy is < 300, fill extensions first so spawn can generate energy
			if(creep.room.energyAvailable < 300) {
				closestTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
						filter: (structure) => {
							return (structure.structureType == STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity;
						}
				});
				
				if(!closestTarget) {
					closestTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
							filter: (structure) => {
								return (structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
							}
					});
				}
			} else {
				closestTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
						filter: (structure) => {
							return (structure.structureType == STRUCTURE_EXTENSION ||
									structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
						}
				});
			}

			if(!closestTarget) {
				closestTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
						filter: (structure) => {
							return (structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
						}
				});
			}
            
            if(closestTarget) {
                if(creep.transfer(closestTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestTarget);
                }
            } else {
                // build
                //var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                //if(targets.length) {
                //    if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                //        creep.moveTo(targets[0]);
                //    }
                //} else {
                    //else transfer to storage
                    var closestStorage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
                    if(creep.transfer(closestStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(closestStorage);
                    }
                    
                    // else upgrade
                    //if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    //    creep.moveTo(creep.room.controller);
                    //}
                //}
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