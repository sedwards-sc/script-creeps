/* jshint esversion: 6, loopfunc: true */
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleDefender = require('role.defender');
var roleExplorer = require('role.explorer');
var roleRemoteMiner = require('role.remoteMiner');
var roleRemoteCarrier = require('role.remoteCarrier');
//var roleMiner = require('role.miner');
//var roleCarrier = require('role.carrier');
var roleReserver = require('role.reserver');
var roleLinker = require('role.linker');
var roleReinforcer = require('role.reinforcer');
var roleClaimer = require('role.claimer');
var roleRemoteUpgrader = require('role.remoteUpgrader');
var roleRemoteBuilder = require('role.remoteBuilder');
//require('prototype.storage');
require('prototype.room');
require('prototype.creep');
require('prototype.spawn');
require('prototype.link');
require('object.rosters');
require('object.remotes');
require('debug').populate(global);

module.exports.loop = function () {

	// loop to clean dead creeps out of memory
    for(let name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

	// run room planning loop occasionally
	if((Game.time % 100) === 0) {
		for(let name in Game.rooms) {
			if(Game.rooms[name].isMine()) {
				Game.rooms[name].planRoom();
			}
		}
	}

	// run room quota count loop occasionally
	if((Game.time % 1) === 0) {
		for(let name in Game.rooms) {
			if(Game.rooms[name].isMine()) {
				Game.rooms[name].countCreepFlags();
			}
		}
	}

	// room defence loop
	for(let name in Game.rooms) {
		Game.rooms[name].assessThreats();

		// skip other rooms so it doesn't mess up anything when i claim a new room
		if(!((name === 'E8S23') || (name === 'E9S27') || (name === 'E9S28'))) {
		    continue;
		}

		defendRoom(name);

		if(name !== 'E8S23') {
		    continue;
		}

		//var hostiles = Game.rooms[name].find(FIND_HOSTILE_CREEPS);
		//if(hostiles.length > 0) {
			let defenders = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender');

			// find room spawns
			let roomSpawns = Game.rooms[name].find(FIND_MY_SPAWNS);
			let mainSpawn = roomSpawns[0];

			if(defenders.length < 1) {
	        	let newName;
				if(Game.rooms[name].energyAvailable >= 1610) {
					newName = mainSpawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK], undefined, {role: 'defender'});
				} else {
					newName = mainSpawn.createCreep([TOUGH,MOVE,ATTACK,MOVE], undefined, {role: 'defender'});
				}
				console.log('Spawning new defender: ' + newName);
				mainSpawn.spawnCalled = 1;
			}
		//}
	}

	Memory.roster = {};
	let roomQuotas = new WorldRoster();
	let remoteInfo = new RoomRemotes();

	// room spawn loop
	for(let roomName in Game.rooms) {
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
				remoteBuilders: 0,
				mineralHarvesters: 0
		};

		// find room spawns
		let roomSpawns = Game.rooms[roomName].find(FIND_MY_SPAWNS);

		// get room creep role quota and remote info for this room
		let roomQuota = roomQuotas[roomName];
		let roomRemoteInfo = remoteInfo[roomName];

		// continue to next room if there are no spawns or no room quota
		if(roomSpawns.length < 1) {
		    continue;
		} else if(roomQuota === undefined) {
			console.log('!!!' + roomName + ' has spawn but no quota!!!');
			continue;
		}

		//if((roomSpawns.length >= 2) && (roomSpawns[0].spawning)) {
		//    var mainSpawn = roomSpawns[1];
		//} else {
		    let mainSpawn = roomSpawns[0];
		//}

		let controllerProgress = Game.rooms[roomName].controller.progress / Game.rooms[roomName].controller.progressTotal * 100;
		let roomEnergy = Game.rooms[roomName].energyAvailable;
		let roomEnergyCapacity = Game.rooms[roomName].energyCapacityAvailable;
		let roomStorageEnergy;
		if(Game.rooms[roomName].storage) {
			roomStorageEnergy = Game.rooms[roomName].storage.store[RESOURCE_ENERGY];
		}

		// print update but not every tick so console doesn't scroll as fast
		if((Game.time % 5) === 0) {
			console.log(roomName + ' - energy avail: ' + roomEnergy + ' / ' + roomEnergyCapacity + ' - storage energy: ' + roomStorageEnergy + ' - controller progress: ' + controllerProgress + '%');
		}

		// send update email occasionally
		if((Game.time % 1500) === 0) {
			Game.notify(roomName + ' - energy avail: ' + roomEnergy + ' / ' + roomEnergyCapacity + ' - storage energy: ' + roomStorageEnergy + ' - controller progress: ' + controllerProgress + '% - time: ' + Game.time);
		}

		// filter for room flags
		let roomFlagRegex = new RegExp('^' + roomName + '_');
		let roomFlags = _.filter(Game.flags, (flag) => roomFlagRegex.test(flag.name) === true);

		// filter for miner flags
		let minerFlags = _.filter(roomFlags, (flag) => /_creep_miner_/.test(flag.name) === true);
		//console.log('***' + roomName + ' ' + minerFlags.length + ' - ' + minerFlags);

		// find room creeps
		let roomCreeps = _.filter(Game.creeps, (creep) => creep.memory.spawnRoom == roomName);

		let harvesters = _.filter(roomCreeps, (creep) => creep.memory.role == 'harvester');
		let builders = _.filter(roomCreeps, (creep) => creep.memory.role == 'builder');
		let upgraders = _.filter(roomCreeps, (creep) => creep.memory.role == 'upgrader');

		let explorers = _.filter(roomCreeps, (creep) => creep.memory.role == 'explorer');

		let remoteMiners = _.filter(roomCreeps, (creep) => creep.memory.role == 'remoteMiner');
		let remoteCarriers = _.filter(roomCreeps, (creep) => creep.memory.role == 'remoteCarrier');

		let miners = _.filter(roomCreeps, (creep) => creep.memory.role == 'miner');
		let carriers = _.filter(roomCreeps, (creep) => creep.memory.role == 'carrier');

		let linkers = _.filter(roomCreeps, (creep) => creep.memory.role == 'linker');

		let reinforcers = _.filter(roomCreeps, (creep) => creep.memory.role == 'reinforcer');

		let reservers = _.filter(roomCreeps, (creep) => creep.memory.role == 'reserver');

		let claimers = _.filter(roomCreeps, (creep) => creep.memory.role == 'claimer');

		let remoteUpgraders = _.filter(roomCreeps, (creep) => creep.memory.role == 'remoteUpgrader');
		let remoteBuilders = _.filter(roomCreeps, (creep) => creep.memory.role == 'remoteBuilder');

		let mineralHarvesters = _.filter(roomCreeps, (creep) => creep.memory.role == 'mineralHarvester');

		//if(roomName === 'E9S27') {
		//	if(harvesters.length < 3) {
		//		mainSpawn.spawnHarvester(roomCreeps);
		//	}
		//}

		// note: top level parts upgrade may not be necessary for harvesters (source already runs out sometimes)
		// quick fix to stop from quickly making weak creeps in a row before extensions can be refilled (still need to recover is creeps are wiped)
        let currentBody;
        let currentHarvesterBody;
		if(carriers.length > 1) {
			currentBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
			currentHarvesterBody = [WORK,CARRY,MOVE,MOVE];
			if(roomEnergy >= 950) {
				currentBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
			}
		} else {
			if(roomEnergy >= 1100) {
				currentBody = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
			} else if(roomEnergy >= 950) {
				currentBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
			} else {
				currentBody = [WORK,CARRY,MOVE,MOVE];
			}
			currentHarvesterBody = currentBody;
		}

        let carrierBody;
		if(roomEnergy >= 400) {
			carrierBody = [CARRY,CARRY,MOVE,MOVE,CARRY,CARRY,MOVE,MOVE];
		} else {
			carrierBody = [CARRY,CARRY,MOVE,MOVE];
		}

		let minerBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE];

        let builderBody;
		if((roomEnergy >= 1800) && (roomStorageEnergy > 500000)) {
			builderBody = [WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,MOVE];
		} else if((roomEnergy >= 950) && (roomStorageEnergy > 100000)) {
			builderBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
		} else if(roomEnergy >= 500) {
			builderBody = [WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
		} else {
			builderBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
		}

        let explorerBody;
		if((roomEnergy >= 1150) && (roomStorageEnergy > 250000)) {
			explorerBody = [WORK,MOVE,WORK,MOVE,CARRY,MOVE,WORK,MOVE,CARRY,MOVE,WORK,MOVE,CARRY,MOVE,WORK,MOVE,CARRY,MOVE];
		} else if(roomEnergy >= 950) {
			explorerBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
		} else {
			explorerBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
		}

		let remoteMinerBody = [WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK];
		let remoteCarrierBody = [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK];

		if((!mainSpawn.spawnCalled) && ((mainSpawn.spawning === null) || (mainSpawn.spawning === undefined))) {
    		if(carriers.length < roomQuota.carriers) {
    			let newName = mainSpawn.createCreep(carrierBody, undefined, {role: 'carrier', spawnRoom: roomName});
    			console.log('Spawning new carrier: ' + newName);
    		} else if(miners.length < minerFlags.length) {
    		    for(let curMinerIndex in minerFlags) {
    		        let curMinerFlagName = minerFlags[curMinerIndex].name;
    		        let currentFlagMiners = _.filter(miners, (miner) => miner.memory.flagName === curMinerFlagName);
    		        if(currentFlagMiners.length < 1) {
    		            let newName = mainSpawn.createCreep(minerBody, undefined, {spawnRoom: roomName, role: 'miner', flagName: curMinerFlagName});
    			        console.log('Spawning new miner: ' + newName + ' - ' + curMinerFlagName);
    			        break;
    		        }
    		    }
    		} else if(linkers.length < roomQuota.linkers) {
    			let newName = mainSpawn.createCreep([CARRY,CARRY,MOVE], undefined, {role: 'linker', spawnRoom: roomName});
    			console.log('Spawning new linker: ' + newName);
    		} else if(harvesters.length < roomQuota.harvesters) {
    			mainSpawn.spawnHarvester(roomCreeps);
    		} else if(builders.length < roomQuota.builders) {
    			let newName = mainSpawn.createCreep(builderBody, undefined, {role: 'builder', spawnRoom: roomName});
    			console.log('Spawning new builder: ' + newName);
    		} else if(upgraders.length < roomQuota.upgraders) {
    			let newName = mainSpawn.createCreep(currentBody, undefined, {role: 'upgrader', spawnRoom: roomName});
    			console.log('Spawning new upgrader: ' + newName);
    		} else if(explorers.length < roomQuota.explorers) {
    			let newName = mainSpawn.createCreep(explorerBody, undefined, {role: 'explorer', spawnRoom: roomName});
    			console.log('Spawning new explorer: ' + newName);
    		} else if(remoteMiners.length < roomQuota.remoteMiners) {
    			if(roomRemoteInfo && (roomRemoteInfo.remoteMiners.length > 0)) {
    				for(let remoteMinersIndex in roomRemoteInfo.remoteMiners) {
    					let currentRemoteMiner = roomRemoteInfo.remoteMiners[remoteMinersIndex];
    					let currentRemoteMinerFilter = _.filter(remoteMiners, (creep) => creep.memory.creepId === currentRemoteMiner.creepId);

    					if(currentRemoteMinerFilter.length < 1) {
    						let newName = mainSpawn.createCreep(remoteMinerBody, undefined, {role: 'remoteMiner', spawnRoom: roomName, creepId: currentRemoteMiner.creepId, rRoomName: currentRemoteMiner.checkPointAway.roomName, rX: currentRemoteMiner.checkPointAway.x, rY: currentRemoteMiner.checkPointAway.y, remoteMine: currentRemoteMiner.sourceIndex});
    						console.log('Spawning new remote miner: ' + newName + ' - ' + JSON.stringify(currentRemoteMiner));
    						break;
    					}
    				}
    			} else {
    				console.log('!!!' + roomName + ' quota has remote miners but there is no remote miner info for this room!!!');
    			}

    			//var remoteMiner0 = _.filter(remoteMiners, (creep) => creep.memory.remoteMine == 0);
    			//var remoteMiner1 = _.filter(remoteMiners, (creep) => creep.memory.remoteMine == 1);

    			//if(remoteMiner0.length < 1) {
    			//	var newName = mainSpawn.createCreep(remoteMinerBody, undefined, {role: 'remoteMiner', remoteMine: 0, spawnRoom: roomName});
    			//	console.log('Spawning new remote miner 0: ' + newName);
    			//} else if(remoteMiner1.length < 1) {
    			//	var newName = mainSpawn.createCreep(remoteMinerBody, undefined, {role: 'remoteMiner', remoteMine: 1, spawnRoom: roomName});
    			//	console.log('Spawning new remote miner 1: ' + newName);
    			//}
    		} else if(remoteCarriers.length < roomQuota.remoteCarriers) {
    			if(roomRemoteInfo && (roomRemoteInfo.remoteCarriers.length > 0)) {
    				for(let remoteCarriersIndex in roomRemoteInfo.remoteCarriers) {
    					let currentRemoteCarrier = roomRemoteInfo.remoteCarriers[remoteCarriersIndex];
    					let currentRemoteCarrierFilter = _.filter(remoteCarriers, (creep) => creep.memory.creepId === currentRemoteCarrier.creepId);

    					if(currentRemoteCarrierFilter.length < 1) {
    						let newName = mainSpawn.createCreep(remoteCarrierBody, undefined, {
    							role: 'remoteCarrier',
    							spawnRoom: roomName,
    							creepId: currentRemoteCarrier.creepId,
    							rRoomName: currentRemoteCarrier.checkPointAway.roomName,
    							rX: currentRemoteCarrier.checkPointAway.x,
    							rY: currentRemoteCarrier.checkPointAway.y,
    							hRoomName: currentRemoteCarrier.checkPointHome.roomName,
    							hX: currentRemoteCarrier.checkPointHome.x,
    							hY: currentRemoteCarrier.checkPointHome.y
    						});
    						console.log('Spawning new remote carrier: ' + newName + ' - ' + JSON.stringify(currentRemoteCarrier));
    						break;
    					}
    				}
    			} else {
    				console.log('!!!' + roomName + ' quota has remote carriers but there is no remote carrier info for this room!!!');
    			}

    			//var newName = mainSpawn.createCreep(remoteCarrierBody, undefined, {role: 'remoteCarrier', spawnRoom: roomName});
    			//console.log('Spawning new remote carrier: ' + newName);
    		} else if(reservers.length < roomQuota.reservers) {
    			if(roomRemoteInfo && (roomRemoteInfo.reservers.length > 0)) {
    				for(let reserversIndex in roomRemoteInfo.reservers) {
    					let currentReserver = roomRemoteInfo.reservers[reserversIndex];
    					let currentReserverFilter = _.filter(reservers, (creep) => creep.memory.creepId === currentReserver.creepId);

    					if(currentReserverFilter.length < 1) {
    						let newName = mainSpawn.createCreep([CLAIM,CLAIM,MOVE,MOVE,MOVE,ATTACK], undefined, {
    							role: 'reserver',
    							spawnRoom: roomName,
    							creepId: currentReserver.creepId,
    							controllerId: currentReserver.controllerId
    						});
    						console.log('Spawning new reserver: ' + newName + ' - ' + JSON.stringify(currentReserver));
    						break;
    					}
    				}
    			} else {
    				console.log('!!!' + roomName + ' quota has reservers but there is no reserver info for this room!!!');
    			}

    			//var newName = mainSpawn.createCreep([CLAIM,CLAIM,MOVE,MOVE], undefined, {role: 'reserver', spawnRoom: roomName});
    			//console.log('Spawning new reserver: ' + newName);
    		} else if(reinforcers.length < roomQuota.reinforcers) {
    			let newName = mainSpawn.createCreep([WORK,MOVE,CARRY,MOVE,WORK,MOVE,CARRY,MOVE,CARRY,MOVE], undefined, {role: 'reinforcer', spawnRoom: roomName});
    			console.log('Spawning new reinforcer: ' + newName);
    		} else if(claimers.length < roomQuota.claimers) {
    			let newName = mainSpawn.createCreep([CLAIM,MOVE], undefined, {role: 'claimer', spawnRoom: roomName});
    			console.log('Spawning new claimer: ' + newName);
    		} else if(remoteUpgraders.length < roomQuota.remoteUpgraders) {
    			let newName = mainSpawn.createCreep(currentBody, undefined, {role: 'remoteUpgrader', spawnRoom: roomName});
    			console.log('Spawning new remote upgrader: ' + newName);
    		} else if(remoteBuilders.length < roomQuota.remoteBuilders) {
    			let newName = mainSpawn.createCreep(currentBody, undefined, {role: 'remoteBuilder', spawnRoom: roomName});
    			console.log('Spawning new remote builder: ' + newName);
    		} else if(mineralHarvesters.length < roomQuota.mineralHarvesters) {
    		    mainSpawn.spawnMineralHarvester();
    		}
		}

		// transfer energy from storage to carriers or reinforcers if they are in range
		let mainStorage = Game.rooms[roomName].storage;
		if(mainStorage) {

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

			let nonFullCarriers = _.filter(roomCreeps, (creep) => {
					return (creep.memory.role === 'carrier') && (creep.carry.energy < creep.carryCapacity);
			});

			let nonFullBuilders = _.filter(roomCreeps, (creep) => {
					return (creep.memory.role === 'builder') && (creep.carry.energy < creep.carryCapacity);
					//return (creep.memory.role === 'builder') && (creep.carry.energy === 0);
			});

			let nonFullReinforcers = _.filter(roomCreeps, (creep) => {
					return (creep.memory.role === 'reinforcer') && (creep.carry.energy === 0);
			});

			let inRangeCarriers = mainStorage.pos.findInRange(nonFullCarriers, 1);
			// EDITS
			let inRangeBuildersPreSort = mainStorage.pos.findInRange(nonFullBuilders, 1);
			let inRangeBuilders = _.sortBy(inRangeBuildersPreSort, function(inRangeBuilder) { return inRangeBuilder.carry.energy; });
			let inRangeReinforcers = mainStorage.pos.findInRange(nonFullReinforcers, 1);

			if(inRangeCarriers.length > 0) {
				if(mainStorage.transfer(inRangeCarriers[0], RESOURCE_ENERGY) === OK) {
					console.log('storage energy transferred to: ' + inRangeCarriers[0].name + ' - ' + inRangeCarriers[0].memory.role);
				}
			} else if(inRangeBuilders.length > 0) {
				if(mainStorage.transfer(inRangeBuilders[0], RESOURCE_ENERGY) === OK) {
					console.log('storage energy transferred to: ' + inRangeBuilders[0].name + ' - ' + inRangeBuilders[0].memory.role);
				}
			} else if(inRangeReinforcers.length > 0) {
				if(mainStorage.transfer(inRangeReinforcers[0], RESOURCE_ENERGY) === OK) {
					console.log('storage energy transferred to: ' + inRangeReinforcers[0].name + ' - ' + inRangeReinforcers[0].memory.role);
				}
			}
		}

		// find non carriers that aren't full of energy
		let nonCarriers = _.filter(roomCreeps, (creep) => {
				return (creep.memory.role !== 'remoteCarrier') && (creep.memory.role !== 'carrier') && (creep.memory.role !== 'explorer') && (creep.memory.role !== 'reinforcer') && (creep.memory.role !== 'mineralHarvester') && (creep.carry.energy < creep.carryCapacity);
		});

		// run links and transfer energy from links to any creeps except carriers
		let links = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_LINK}});
		links.forEach(link => link.run());

		for(let linkIndex in links) {
			let currentLink = links[linkIndex];

			let inRangeCreepsPreSort = currentLink.pos.findInRange(nonCarriers, 1);
			let inRangeCreeps = _.sortBy(inRangeCreepsPreSort, function(inRangeCreep) { return inRangeCreep.carry.energy; });

			if(inRangeCreeps.length > 0) {
				if(currentLink.transferEnergyFirstTimeOnly(inRangeCreeps[0]) === OK) {
					console.log('link energy transferred to: ' + inRangeCreeps[0].name + ' - ' + inRangeCreeps[0].memory.role);
				}
			}
		}
	}

	// run creep loop
    for(let creepName in Game.creeps) {
        let creep = Game.creeps[creepName];

		if(!creep.spawning) {
			if(creep.memory.role == 'miner') {
				creep.run();
				Memory.roster[creep.pos.roomName].miners++;
			}
			if(creep.memory.role == 'carrier') {
				creep.run();
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
			if(creep.memory.role == 'mineralHarvester') {
				creep.run();
				Memory.roster[creep.pos.roomName].mineralHarvesters++;
			}
		} else {
			// this is a test that will break when there are multiple spawns working and will remain when nothing is spawning
			// TODO fix this to be better
			Memory.creepSpawning = creep.memory.role;
		}
    }

};

function defendRoom(roomName) {

    let hostiles = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);

    if(hostiles.length > 0) {
        let username = hostiles[0].owner.username;
		let gameTime = Game.time;
        Game.notify(`User ${username} spotted in room ${roomName} at ${gameTime}`);
        let towers = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        towers.forEach(tower => tower.attack(hostiles[0]));
    } else {
		let ramparts = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_RAMPART) && structure.hits < 100000;
				}
		});
		let sortedRamparts = _.sortBy(ramparts, function(rampart) { return rampart.hits; });

		let walls = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_WALL) && structure.hits < 100000;
				}
		});
		let sortedWalls = _.sortBy(walls, function(wall) { return wall.hits; });

		let damagedContainersAndRoads = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_ROAD) && structure.hits < structure.hitsMax;
				}
		});
		let sortedDamagedContainersAndRoads = _.sortBy(damagedContainersAndRoads, function(damagedContainerOrRoad) { return damagedContainerOrRoad.hits; });

		//var towers = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
		let towers = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {
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
