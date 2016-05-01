var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleDefender = require('role.defender');
var roleExplorer = require('role.explorer');

module.exports.loop = function () {

	// loop to clean dead creeps out of memory
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }
    
	
	// room defence loop
    for(var name in Game.rooms) {
        defendRoom(name);
        var hostiles = Game.rooms[name].find(FIND_HOSTILE_CREEPS);
        if(hostiles.length > 0) {
                var defenders = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender');
            
                if(defenders.length < 1) {
					if(Game.rooms[name].energyAvailable >= 1610) {
						var newName = Game.spawns.Spawn1.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK], undefined, {role: 'defender'});
					} else {
						var newName = Game.spawns.Spawn1.createCreep([TOUGH,MOVE,ATTACK,MOVE], undefined, {role: 'defender'});
					}
                    console.log('Spawning new defender: ' + newName);
                }
        }
    }


	// room spawn loop
	for(var roomName in Game.rooms) {
		// find room spawns
		var roomSpawns = Game.rooms[roomName].find(FIND_MY_SPAWNS);
		
		// continue to next room if there are no spawns
		if(roomSpawns.length < 1) {
		    continue;
		}
		
		var mainSpawn = roomSpawns[0];
	
		// find room creeps
		var roomCreeps = _.filter(Game.creeps, (creep) => creep.memory.spawnRoom == roomName);
		
		var harvesters = _.filter(roomCreeps, (creep) => creep.memory.role == 'harvester');
		var builders = _.filter(roomCreeps, (creep) => creep.memory.role == 'builder');
		var upgraders = _.filter(roomCreeps, (creep) => creep.memory.role == 'upgrader');
		var explorers = _.filter(roomCreeps, (creep) => creep.memory.role == 'explorer');

		// note: top level parts upgrade may not be necessary for harvesters (source already runs out sometimes)
		if(Game.rooms[roomName].energyAvailable >= 1100) {
			var currentBody = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
		} else if(Game.rooms[roomName].energyAvailable >= 950) {
			var currentBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
		} else {
			var currentBody = [WORK,CARRY,MOVE,MOVE];
		}
		
		if(harvesters.length < 4) {
			var newName = mainSpawn.createCreep(currentBody, undefined, {role: 'harvester', spawnRoom: roomName});
			console.log('Spawning new harvester: ' + newName);
		} else if(builders.length < 2) {
			var newName = mainSpawn.createCreep(currentBody, undefined, {role: 'builder', spawnRoom: roomName});
			console.log('Spawning new builder: ' + newName);
		} else if(upgraders.length < 2) {
			var newName = mainSpawn.createCreep(currentBody, undefined, {role: 'upgrader', spawnRoom: roomName});
			console.log('Spawning new upgrader: ' + newName);
		} else if(explorers.length < 1) {
			var newName = mainSpawn.createCreep([WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], undefined, {role: 'explorer', spawnRoom: roomName});
			console.log('Spawning new explorer: ' + newName);
		}
	}


	// run creep loop
    for(var creepName in Game.creeps) {
        var creep = Game.creeps[creepName];
		
		if(!creep.spawning) {
			if(creep.memory.role == 'harvester') {
				roleHarvester.run(creep);
			}
			if(creep.memory.role == 'upgrader') {
				roleUpgrader.run(creep);
			}
			if(creep.memory.role == 'builder') {
				roleBuilder.run(creep);
			}
			if(creep.memory.role == 'defender') {
				roleDefender.run(creep);
			}
			if(creep.memory.role == 'explorer') {
				roleExplorer.run(creep);
			}
		}
    }
	
}

function defendRoom(roomName) {
    
    var hostiles = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);
    
    if(hostiles.length > 0) {
        var username = hostiles[0].owner.username;
        Game.notify(`User ${username} spotted in room ${roomName}`);
        var towers = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        towers.forEach(tower => tower.attack(hostiles[0]));
    } else {
		//var walls = Game.rooms[roomName].find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_WALL}});
		var defenses = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) && structure.hits < 15000;
				}
		});
		
		var walls = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_WALL) && structure.hits < 15000;
				}
		});
		
		var ramparts = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_RAMPART) && structure.hits < 15000;
				}
		});
		
		if(ramparts.length >= 1) {
		
		} else if(walls.length >= 1) {
		
		}
		var towers = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
		towers.forEach(tower => tower.repair(defenses[0]));
	}
}

// ##old ingredients
// #harvester
        //var newName = Game.spawns.Spawn1.createCreep([WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], undefined, {role: 'harvester'});
        //var newName = Game.spawns.Spawn1.createCreep([WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], undefined, {role: 'harvester'});
        //var newName = Game.spawns.Spawn1.createCreep([WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE], undefined, {role: 'harvester'});
// #upgrader
        //var newName = Game.spawns.Spawn1.createCreep([WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], undefined, {role: 'builder'});
        //var newName = Game.spawns.Spawn1.createCreep([WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], undefined, {role: 'builder'});
        //var newName = Game.spawns.Spawn1.createCreep([WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE], undefined, {role: 'builder'});
// #builder
        //var newName = Game.spawns.Spawn1.createCreep([WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], undefined, {role: 'upgrader'});
        //var newName = Game.spawns.Spawn1.createCreep([WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], undefined, {role: 'upgrader'});
        //var newName = Game.spawns.Spawn1.createCreep([WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE], undefined, {role: 'upgrader'});

/*
    var tower = Game.getObjectById('id655200');
    if(tower) {
        var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
        if(closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
        }

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            tower.attack(closestHostile);
        }
    }
*/

/*
    for(var name in Game.rooms) {
        console.log('Room "'+name+'" has '+Game.rooms[name].energyAvailable+' energy');
    }
*/

    //var sources = Game.room.find(FIND_SOURCES);
    //console.log("source length" + sources.length);
	