var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleDefender = require('role.defender');
var roleExplorer = require('role.explorer');
var roleRemoteMiner = require('role.remoteMiner');
var roleRemoteCarrier = require('role.remoteCarrier');
var roleMiner = require('role.miner');
var roleCarrier = require('role.carrier');
var roleReserver = require('role.reserver');
var roleLinker = require('role.linker');
var roleReinforcer = require('role.reinforcer');
var roleClaimer = require('role.claimer');
var roleRemoteUpgrader = require('role.remoteUpgrader');
var roleRemoteBuilder = require('role.remoteBuilder');
//require('prototype.storage');
//require('prototype.creep');
require('prototype.spawn');
require('object.rosters');
require('debug').populate(global);

module.exports.loop = function () {

	// loop to clean dead creeps out of memory
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }
    
	
	// room defence loop
	for(var name in Game.rooms) {
		// skip other rooms so it doesn't mess up anything when i claim a new room
		if(!((name === 'E8S23') || (name === 'E9S27'))) {
		    continue;
		}
	
		defendRoom(name);
		
		if(name !== 'E8S23') {
		    continue;
		}
		
		var hostiles = Game.rooms[name].find(FIND_HOSTILE_CREEPS);
		if(hostiles.length > 0) {
			var defenders = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender');
			
			// find room spawns
			var roomSpawns = Game.rooms[name].find(FIND_MY_SPAWNS);
			var mainSpawn = roomSpawns[0];
			
			if(defenders.length < 1) {
				if(Game.rooms[name].energyAvailable >= 1610) {
					var newName = mainSpawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK], undefined, {role: 'defender'});
				} else {
					var newName = mainSpawn.createCreep([TOUGH,MOVE,ATTACK,MOVE], undefined, {role: 'defender'});
				}
				console.log('Spawning new defender: ' + newName);
			}
		}
	}

	Memory.roster = {};

	// room spawn loop
	for(var roomName in Game.rooms) {
		Memory.roster[roomName] = {
				harvesters: 0,
				builders: 0,
				upgraders: 0,
				explorers: 0,
				remoteMiners: 0,
				remoteCarriers: 0,
				miners: 0,
				carriers: 0,
				linkers: 0,
				reinforcers: 0,
				reservers: 0,
				claimers: 0,
				remoteUpgraders: 0,
				remoteBuilders: 0
		};
	
		// find room spawns
		var roomSpawns = Game.rooms[roomName].find(FIND_MY_SPAWNS);
		
		// continue to next room if there are no spawns
		if(roomSpawns.length < 1) {
		    continue;
		}
		
		var mainSpawn = roomSpawns[0];

		var controllerProgress = Game.rooms[roomName].controller.progress / Game.rooms[roomName].controller.progressTotal * 100;
		var roomEnergy = Game.rooms[roomName].energyAvailable;
		var roomEnergyCapacity = Game.rooms[roomName].energyCapacityAvailable;
		var roomStorageEnergy;
		if(Game.rooms[roomName].storage) {
			roomStorageEnergy = Game.rooms[roomName].storage.store[RESOURCE_ENERGY];
		}
		console.log(roomName + ' - energy avail: ' + roomEnergy + ' / ' + roomEnergyCapacity + ' - storage energy: ' + roomStorageEnergy + ' - controller progress: ' + controllerProgress + '%');
		
		// find room creeps
		var roomCreeps = _.filter(Game.creeps, (creep) => creep.memory.spawnRoom == roomName);
		
		var harvesters = _.filter(roomCreeps, (creep) => creep.memory.role == 'harvester');
		var builders = _.filter(roomCreeps, (creep) => creep.memory.role == 'builder');
		var upgraders = _.filter(roomCreeps, (creep) => creep.memory.role == 'upgrader');
		
		var explorers = _.filter(roomCreeps, (creep) => creep.memory.role == 'explorer');
		
		var remoteMiners = _.filter(roomCreeps, (creep) => creep.memory.role == 'remoteMiner');
		var remoteCarriers = _.filter(roomCreeps, (creep) => creep.memory.role == 'remoteCarrier');
		
		var miners = _.filter(roomCreeps, (creep) => creep.memory.role == 'miner');
		var carriers = _.filter(roomCreeps, (creep) => creep.memory.role == 'carrier');
		
		var linkers = _.filter(roomCreeps, (creep) => creep.memory.role == 'linker');
		
		var reinforcers = _.filter(roomCreeps, (creep) => creep.memory.role == 'reinforcer');
		
		var reservers = _.filter(roomCreeps, (creep) => creep.memory.role == 'reserver');
		
		var claimers = _.filter(roomCreeps, (creep) => creep.memory.role == 'claimer');
		
		var remoteUpgraders = _.filter(roomCreeps, (creep) => creep.memory.role == 'remoteUpgrader');
		var remoteBuilders = _.filter(roomCreeps, (creep) => creep.memory.role == 'remoteBuilder');
		
		if(roomName === 'E9S27') {
			if(harvesters.length < 3) {
				mainSpawn.spawnHarvester(roomCreeps);
			}
		}
		
		// skip other rooms so it doesn't mess up anything when i claim a new room
		// TODO create spawning for new room
		if(roomName !== 'E8S23') {
		    continue;
		}
		
		// note: top level parts upgrade may not be necessary for harvesters (source already runs out sometimes)
		// quick fix to stop from quickly making weak creeps in a row before extensions can be refilled (still need to recover is creeps are wiped)
		if(carriers.length > 1) {
			var currentBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
			var currentHarvesterBody = [WORK,CARRY,MOVE,MOVE];
			if(roomEnergy >= 950) {
				var currentBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
			}
		} else {
			if(roomEnergy >= 1100) {
				var currentBody = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
			} else if(roomEnergy >= 950) {
				var currentBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
			} else {
				var currentBody = [WORK,CARRY,MOVE,MOVE];
			}
			var currentHarvesterBody = currentBody;
		}
		
		if(roomEnergy >= 400) {
			var carrierBody = [CARRY,CARRY,MOVE,MOVE,CARRY,CARRY,MOVE,MOVE];
		} else {
			var carrierBody = [CARRY,CARRY,MOVE,MOVE];
		}
		
		var minerBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE];
		
		if((roomEnergy >= 1800) && (roomStorageEnergy > 500000)) {
			var builderBody = [WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,MOVE];
		} else if(roomEnergy >= 950) {
			var builderBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
		} else {
			var builderBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
		}
		
		var remoteMinerBody = [WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE];
		var remoteCarrierBody = [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
		
		if(carriers.length < 2) {
			var newName = mainSpawn.createCreep(carrierBody, undefined, {role: 'carrier', spawnRoom: roomName});
			console.log('Spawning new carrier: ' + newName);
		} else if(miners.length < 1) {
			var newName = mainSpawn.createCreep(minerBody, undefined, {role: 'miner', spawnRoom: roomName});
			console.log('Spawning new miner: ' + newName);
		} else if(linkers.length < 1) {
			var newName = mainSpawn.createCreep([CARRY,MOVE], undefined, {role: 'linker', spawnRoom: roomName});
			console.log('Spawning new linker: ' + newName);
		} else if(harvesters.length < 0) {
			mainSpawn.spawnHarvester(roomCreeps);
		} else if(builders.length < 4) {
			var newName = mainSpawn.createCreep(builderBody, undefined, {role: 'builder', spawnRoom: roomName});
			console.log('Spawning new builder: ' + newName);
		} else if(upgraders.length < 0) {
			var newName = mainSpawn.createCreep(currentBody, undefined, {role: 'upgrader', spawnRoom: roomName});
			console.log('Spawning new upgrader: ' + newName);
		} else if(explorers.length < 3) {
			var newName = mainSpawn.createCreep(currentBody, undefined, {role: 'explorer', spawnRoom: roomName});
			console.log('Spawning new explorer: ' + newName);
		} else if(remoteMiners.length < 2) {
			var remoteMiner0 = _.filter(remoteMiners, (creep) => creep.memory.remoteMine == 0);
			var remoteMiner1 = _.filter(remoteMiners, (creep) => creep.memory.remoteMine == 1);
			
			if(remoteMiner0.length < 1) {
				var newName = mainSpawn.createCreep(remoteMinerBody, undefined, {role: 'remoteMiner', remoteMine: 0, spawnRoom: roomName});
				console.log('Spawning new remote miner 0: ' + newName);
			} else if(remoteMiner1.length < 1) {
				var newName = mainSpawn.createCreep(remoteMinerBody, undefined, {role: 'remoteMiner', remoteMine: 1, spawnRoom: roomName});
				console.log('Spawning new remote miner 1: ' + newName);
			}
		} else if(remoteCarriers.length < 4) {
			var newName = mainSpawn.createCreep(remoteCarrierBody, undefined, {role: 'remoteCarrier', spawnRoom: roomName});
			console.log('Spawning new remote carrier: ' + newName);
		} else if(reservers.length < 1) {
			var newName = mainSpawn.createCreep([CLAIM,CLAIM,MOVE,MOVE], undefined, {role: 'reserver', spawnRoom: roomName});
			console.log('Spawning new reserver: ' + newName);
		} else if(reinforcers.length < 2) {
			var newName = mainSpawn.createCreep([WORK,MOVE,CARRY,MOVE,WORK,MOVE,CARRY,MOVE,CARRY,MOVE], undefined, {role: 'reinforcer', spawnRoom: roomName});
			console.log('Spawning new reinforcer: ' + newName);
		} else if(claimers.length < 0) {
			var newName = mainSpawn.createCreep([CLAIM,MOVE], undefined, {role: 'claimer', spawnRoom: roomName});
			console.log('Spawning new claimer: ' + newName);
		} else if(remoteUpgraders.length < 1) {
			var newName = mainSpawn.createCreep(currentBody, undefined, {role: 'remoteUpgrader', spawnRoom: roomName});
			console.log('Spawning new remote upgrader: ' + newName);
		} else if(remoteBuilders.length < 2) {
			var newName = mainSpawn.createCreep(currentBody, undefined, {role: 'remoteBuilder', spawnRoom: roomName});
			console.log('Spawning new remote builder: ' + newName);
		}

		// transfer energy from storage to carriers or reinforcers if they are in range
		var storages = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
		if(storages.length > 0) {
			var mainStorage = storages[0];
			
			/*
			var candidates = _.filter(roomCreeps, (creep) => {
					return ((creep.memory.role === 'carrier') || (creep.memory.role === 'reinforcer')) && creep.carry.energy < creep.carryCapacity;
			});
			
			var inRangeCandidates = mainStorage.pos.findInRange(candidates, 1);
			
			if(inRangeCandidates.length > 0) {
				if(mainStorage.transfer(inRangeCandidates[0], RESOURCE_ENERGY) === OK) {
					console.log('storage energy transferred to: ' + inRangeCandidates[0].name + ' - ' + inRangeCandidates[0].memory.role);
				}
			}
			*/
			
			var nonFullCarriers = _.filter(roomCreeps, (creep) => {
					return (creep.memory.role === 'carrier') && (creep.carry.energy < creep.carryCapacity);
			});
			
			var nonFullReinforcers = _.filter(roomCreeps, (creep) => {
					return (creep.memory.role === 'reinforcer') && (creep.carry.energy === 0);
			});
			
			var inRangeCarriers = mainStorage.pos.findInRange(nonFullCarriers, 1);
			var inRangeReinforcers = mainStorage.pos.findInRange(nonFullReinforcers, 1);
			
			if(inRangeCarriers.length > 0) {
				if(mainStorage.transfer(inRangeCarriers[0], RESOURCE_ENERGY) === OK) {
					console.log('storage energy transferred to: ' + inRangeCarriers[0].name + ' - ' + inRangeCarriers[0].memory.role);
				}
			} else if(inRangeReinforcers.length > 0) {
				if(mainStorage.transfer(inRangeReinforcers[0], RESOURCE_ENERGY) === OK) {
					console.log('storage energy transferred to: ' + inRangeReinforcers[0].name + ' - ' + inRangeReinforcers[0].memory.role);
				}
			}
		}
		
		// transfer energy across room if remote link is full and refillers are in range
		var storageLink = Game.getObjectById('573a6ed5d32c966b71bd066b');
		var remoteLink = Game.getObjectById('573a7a3d3f08575071c9c160');
		var remoteLink2 = Game.getObjectById('57425474d734dbd25194bbc0');
		
		var refillers = _.filter(roomCreeps, (creep) => {
				return ((creep.memory.role === 'remoteCarrier') || (creep.memory.role === 'carrier') || (creep.memory.role === 'explorer')) && (creep.carry.energy > 0);
		});
		
		// for remote link 1
		var inRangeRefillers = remoteLink.pos.findInRange(refillers, 3);
		if((inRangeRefillers.length > 0) && (remoteLink.energy === remoteLink.energyCapacity)) {
			var transferReturn = remoteLink.transferEnergy(storageLink);
			if(transferReturn === OK) {
				console.log('remote link energy transferred to storage link');
				if(Memory.transferCount === undefined) {
					Memory.transferCount = 1;
				} else {
					Memory.transferCount++;
				}
			} else if(transferReturn === ERR_TIRED) {
				console.log('too tired to transfer remote link energy to storage link');
				if(Memory.transferTired === undefined) {
					Memory.transferTired = 1;
				} else {
					Memory.transferTired++;
				}
			}
		}
		
		// for remote link 2
		var inRangeRefillers2 = remoteLink2.pos.findInRange(refillers, 3);
		if((inRangeRefillers2.length > 0) && (remoteLink2.energy === remoteLink2.energyCapacity)) {
			var transferReturn2 = remoteLink2.transferEnergy(storageLink);
			if(transferReturn2 === OK) {
				console.log('remote link 2 energy transferred to storage link');
				if(Memory.transferCount2 === undefined) {
					Memory.transferCount2 = 1;
				} else {
					Memory.transferCount2++;
				}
			} else if(transferReturn2 === ERR_TIRED) {
				console.log('too tired to transfer remote link 2 energy to storage link');
				if(Memory.transferTired2 === undefined) {
					Memory.transferTired2 = 1;
				} else {
					Memory.transferTired2++;
				}
			}
		}
		
		// find non carriers that aren't full of energy
		var nonCarriers = _.filter(roomCreeps, (creep) => {
				return (creep.memory.role !== 'remoteCarrier') && (creep.memory.role !== 'carrier') && (creep.memory.role !== 'explorer') && (creep.memory.role !== 'reinforcer') && (creep.carry.energy < creep.carryCapacity);
		});

		// transfer energy from links to any creeps except carriers
		var links = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_LINK}});
		for(var linkIndex in links) {
			var currentLink = links[linkIndex];
			
			var inRangeCreeps = currentLink.pos.findInRange(nonCarriers, 1);
			
			if(inRangeCreeps.length > 0) {
				if(currentLink.transferEnergy(inRangeCreeps[0]) === OK) {
					console.log('link energy transferred to: ' + inRangeCreeps[0].name + ' - ' + inRangeCreeps[0].memory.role);
				}
			}
		}
	}

	var rosterTest = new RoomRoster();
	
	console.log(JSON.stringify(rosterTest));
	
	// run creep loop
    for(var creepName in Game.creeps) {
        var creep = Game.creeps[creepName];
		
		if(!creep.spawning) {
			
		
			if(creep.memory.role == 'miner') {
				roleMiner.run(creep);
				Memory.roster[creep.pos.roomName].miners++;
			}
			if(creep.memory.role == 'carrier') {
				roleCarrier.run(creep);
				Memory.roster[creep.pos.roomName].carriers++;
			}
			if(creep.memory.role == 'linker') {
				roleLinker.run(creep);
				Memory.roster[creep.pos.roomName].linkers++;
			}
			if(creep.memory.role == 'harvester') {
				roleHarvester.run(creep);
				Memory.roster[creep.pos.roomName].harvesters++;
			}
			if(creep.memory.role == 'upgrader') {
				roleUpgrader.run(creep);
				Memory.roster[creep.pos.roomName].upgraders++;
			}
			if(creep.memory.role == 'builder') {
				roleBuilder.run(creep);
				Memory.roster[creep.pos.roomName].builders++;
			}
			if(creep.memory.role == 'defender') {
				roleDefender.run(creep);
				Memory.roster[creep.pos.roomName].defenders++;
			}
			if(creep.memory.role == 'explorer') {
				roleExplorer.run(creep);
				Memory.roster[creep.pos.roomName].explorers++;
			}
			if(creep.memory.role == 'remoteMiner') {
				roleRemoteMiner.run(creep);
				Memory.roster[creep.pos.roomName].remoteMiners++;
			}
			if(creep.memory.role == 'remoteCarrier') {
				roleRemoteCarrier.run(creep);
				Memory.roster[creep.pos.roomName].remoteCarriers++;
			}
			if(creep.memory.role == 'reserver') {
				roleReserver.run(creep);
				Memory.roster[creep.pos.roomName].reservers++;
			}
			if(creep.memory.role == 'reinforcer') {
				roleReinforcer.run(creep);
				Memory.roster[creep.pos.roomName].reinforcers++;
			}
			if(creep.memory.role == 'claimer') {
				roleClaimer.run(creep);
				Memory.roster[creep.pos.roomName].claimers++;
			}
			if(creep.memory.role == 'remoteUpgrader') {
				roleRemoteUpgrader.run(creep);
				Memory.roster[creep.pos.roomName].remoteUpgraders++;
			}
			if(creep.memory.role == 'remoteBuilder') {
				roleRemoteBuilder.run(creep);
				Memory.roster[creep.pos.roomName].remoteBuilders++;
			}
		} else {
			// this is a test that will break when there are multiple spawns working and will remain when nothing is spawning
			// TODO fix this to be better
			Memory.creepSpawning = creep.memory.role;
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
		var ramparts = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_RAMPART) && structure.hits < 1000000;
				}
		});
		var sortedRamparts = _.sortBy(ramparts, function(rampart) { return rampart.hits; });

		var walls = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_WALL) && structure.hits < 1000000;
				}
		});
		var sortedWalls = _.sortBy(walls, function(wall) { return wall.hits; });
		
		var damagedContainersAndRoads = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_ROAD) && structure.hits < structure.hitsMax;
				}
		});
		var sortedDamagedContainersAndRoads = _.sortBy(damagedContainersAndRoads, function(damagedContainerOrRoad) { return damagedContainerOrRoad.hits; });
		
		//var towers = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
		var towers = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {
				filter: (tower) => {
					return (tower.structureType == STRUCTURE_TOWER) && tower.energy > 400;
				}
		});
		
		if(sortedRamparts.length >= 1) {
			towers.forEach(tower => tower.repair(sortedRamparts[0]));
		} else if(sortedWalls.length >= 1) {
			towers.forEach(tower => tower.repair(sortedWalls[0]));
		} else if(sortedDamagedContainersAndRoads.length >= 1) {
			towers.forEach(tower => tower.repair(sortedDamagedContainersAndRoads[0]));
		}
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

//var walls = Game.rooms[roomName].find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_WALL}});
/*
		var defenses = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) && structure.hits < 35000;
				}
		});
*/
