/* jshint esversion: 6, loopfunc: true */
require('utils').populateUtils(global);
//var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
//var roleBuilder = require('role.builder');
var roleDefender = require('role.defender');
var roleExplorer = require('role.explorer');
//var roleRemoteMiner = require('role.remoteMiner');
//var roleRemoteCarrier = require('role.remoteCarrier');
//var roleMiner = require('role.miner');
//var roleCarrier = require('role.carrier');
var roleReserver = require('role.reserver');
//var roleLinker = require('role.linker');
//var roleReinforcer = require('role.reinforcer');
var roleClaimer = require('role.claimer');
var roleRemoteUpgrader = require('role.remoteUpgrader');
var roleRemoteBuilder = require('role.remoteBuilder');
//require('prototype.storage');
require('prototype.room');
require('prototype.creep');
require('prototype.flag');
require('prototype.spawn');
require('prototype.link');
require('object.rosters');
require('object.remotes');
require('debug').populate(global);
var profiler = require('screeps-profiler');

if(Memory.enableProfiler === true) {
	profiler.enable();
}

module.exports.loop = function () {
	profiler.wrap(function() {
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
		if((Game.time % 100) === 5) {
			for(let name in Game.rooms) {
				if(Game.rooms[name].isMine()) {
					Game.rooms[name].countCreepFlags();
				}
			}
		}

		// room defence loop
		for(let name in Game.rooms) {
			Game.rooms[name].assessThreats();

			// skip rooms i don't own
			if(!Game.rooms[name].isMine()) {
			    continue;
			}

			defendRoom(name);

			// spawn defenders
			if(name === 'E8S23') {
				let defenders = _.filter(Game.creeps, (creep) => {
					return (creep.memory.role === 'defender') && (creep.memory.spawnRoom === name);
				});

				if(defenders.length < 1) {
					// find room spawns
					let roomSpawns = Game.rooms[name].find(FIND_MY_SPAWNS);
					let mainSpawn = roomSpawns[0];

					let newName;
					if(Game.rooms[name].energyAvailable >= 1610) {
						newName = mainSpawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK], undefined, {spawnRoom: name, role: 'defender'});
					} else {
						newName = mainSpawn.createCreep([TOUGH,MOVE,ATTACK,MOVE], undefined, {spawnRoom: name, role: 'defender'});
					}
					console.log('Spawning new defender: ' + newName + ' (' + name + ')');
					mainSpawn.spawnCalled = 1;
				}
			} else {
				if(Game.rooms[name].memory.hostiles > 0) {
					let defenders = _.filter(Game.creeps, (creep) => {
						return (creep.memory.role === 'defender') && (creep.memory.spawnRoom === name);
					});

					if(defenders.length < 1) {
						// find room spawns
						let roomSpawns = Game.rooms[name].find(FIND_MY_SPAWNS);
						let mainSpawn = roomSpawns[0];

						let newName;
						if(Game.rooms[name].energyAvailable >= 1610) {
							newName = mainSpawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK], undefined, {spawnRoom: name, role: 'defender'});
						} else {
							newName = mainSpawn.createCreep([TOUGH,MOVE,ATTACK,MOVE], undefined, {spawnRoom: name, role: 'defender'});
						}
						console.log('Spawning new defender: ' + newName + ' (' + name + ')');
						mainSpawn.spawnCalled = 1;
					}
				}
			}
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

			Game.rooms[roomName].countCreepRoles();

			// find room creeps
			let roomCreeps = _.filter(Game.creeps, (creep) => creep.memory.spawnRoom == roomName);

			//if(roomName === 'E9S27') {
			//	if(harvesters.length < 3) {
			//		mainSpawn.spawnHarvester(roomCreeps);
			//	}
			//}

			// note: top level parts upgrade may not be necessary for harvesters (source already runs out sometimes)
			// quick fix to stop from quickly making weak creeps in a row before extensions can be refilled (still need to recover is creeps are wiped)
			// TODO: check which of this body code can be deprecated
	        let currentBody;
	        let currentHarvesterBody;
			if(undefToZero(Game.rooms[roomName].memory.creepRoster.carrier) > 1) {
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
				} else if(roomEnergy >= 800) {
				    // NOTE: this config is really only good for upgraders that can reach the controller from an energy source (e.g. storage)
				    currentBody = [WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE];
				} else if(roomEnergy >= 350) {
				    currentBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
				} else {
					currentBody = [WORK,CARRY,MOVE,MOVE];
				}
				currentHarvesterBody = currentBody;
			}

			let upgraderBody;
			if(roomEnergyCapacity >= 850) {
				upgraderBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE];
			} else if(roomEnergyCapacity >= 800) {
			    // NOTE: this config is really only good for upgraders that can reach the controller from an energy source (e.g. storage)
			    upgraderBody = [WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE];
			} else if(roomEnergyCapacity >= 350) {
			    upgraderBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
			} else {
				upgraderBody = [WORK,CARRY,MOVE,MOVE];
			}

	        let carrierBody;
			if(roomEnergy >= 400) {
				carrierBody = [CARRY,CARRY,MOVE,MOVE,CARRY,CARRY,MOVE,MOVE];
			} else {
				carrierBody = [CARRY,CARRY,MOVE,MOVE];
			}

			let minerBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE];

	        let builderBody;
			if((roomEnergy >= 1900) && (roomStorageEnergy > 500000)) {
				builderBody = [WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,MOVE,CARRY,MOVE];
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
				let roomCreepRoster = Game.rooms[roomName].memory.creepRoster;
				let roomCreepQuotas = Game.rooms[roomName].memory.creepQuotas;
	    		if((roomCreepQuotas.carrier) && (undefToZero(roomCreepRoster.carrier) < roomCreepQuotas.carrier.length)) {
	    			let newName = mainSpawn.createCreep(carrierBody, undefined, {role: 'carrier', spawnRoom: roomName});
	    			console.log('Spawning new carrier (' + roomName + '): ' + newName);
	    		} else if((roomCreepQuotas.miner) && (undefToZero(roomCreepRoster.miner) < roomCreepQuotas.miner.length)) {
	    		    for(let curMinerIndex in roomCreepQuotas.miner) {
	    		        let curMinerFlagName = roomCreepQuotas.miner[curMinerIndex];
	    		        let currentFlagMiners = _.filter(roomCreeps, (creep) => creep.memory.flagName === curMinerFlagName);
	    		        if((currentFlagMiners.length < 1) || (currentFlagMiners[0].ticksToLive <= 36)) {
	    		            let newName = mainSpawn.createCreep(minerBody, undefined, {spawnRoom: roomName, role: 'miner', flagName: curMinerFlagName});
	    			        console.log('Spawning new miner: ' + newName + ' - ' + curMinerFlagName);
	    			        break;
	    		        }
	    		    }
	    		} else if((roomCreepQuotas.linker) && (undefToZero(roomCreepRoster.linker) < roomCreepQuotas.linker.length)) {
					for(let curLinkerIndex in roomCreepQuotas.linker) {
	    		        let curLinkerFlagName = roomCreepQuotas.linker[curLinkerIndex];
	    		        let currentFlagLinkers = _.filter(roomCreeps, (creep) => creep.memory.flagName === curLinkerFlagName);
	    		        if((currentFlagLinkers.length < 1) || (currentFlagLinkers[0].ticksToLive <= 12)) {
	    		            let newName = mainSpawn.createCreep([CARRY,CARRY,MOVE], undefined, {spawnRoom: roomName, role: 'linker', flagName: curLinkerFlagName});
	    			        console.log('Spawning new linker: ' + newName + ' - ' + curLinkerFlagName);
	    			        break;
	    		        }
	    		    }
	    		} else if((roomCreepQuotas.harvester) && (undefToZero(roomCreepRoster.harvester) < roomCreepQuotas.harvester.length)) {
	    			mainSpawn.spawnHarvester2(roomCreeps);
	    		} else if((roomCreepQuotas.builder) && (undefToZero(roomCreepRoster.builder) < roomCreepQuotas.builder.length)) {
					for(let curBuilderIndex in roomCreepQuotas.builder) {
	    		        let curBuilderFlagName = roomCreepQuotas.builder[curBuilderIndex];
	    		        let currentFlagBuilders = _.filter(roomCreeps, (creep) => creep.memory.flagName === curBuilderFlagName);
						if(Game.flags[curBuilderFlagName].memory.bodyParts) {
							builderBody = Game.flags[curBuilderFlagName].memory.bodyParts;
						}
	    		        if((currentFlagBuilders.length < 1) || (currentFlagBuilders[0].ticksToLive <= (builderBody.length * 3))) {
	    		            let newName = mainSpawn.createCreep(builderBody, undefined, {spawnRoom: roomName, role: 'builder', flagName: curBuilderFlagName});
	    			        console.log('Spawning new builder: ' + newName + ' - ' + curBuilderFlagName);
	    			        break;
	    		        }
	    		    }
	    		} else if(undefToZero(roomCreepRoster.upgrader) < roomQuota.upgraders) {
	    			let newName = mainSpawn.createCreep(upgraderBody, undefined, {role: 'upgrader', spawnRoom: roomName});
	    			console.log('Spawning new upgrader (' + roomName + '): ' + newName);
	    		} else if(undefToZero(roomCreepRoster.explorer) < roomQuota.explorers) {
	    			let newName = mainSpawn.createCreep(explorerBody, undefined, {role: 'explorer', spawnRoom: roomName});
	    			console.log('Spawning new explorer (' + roomName + '): ' + newName);
	    		} else if((roomCreepQuotas.remoteMiner) && (undefToZero(roomCreepRoster.remoteMiner) < roomCreepQuotas.remoteMiner.length)) {
					for(let curRemoteMinerIndex in roomCreepQuotas.remoteMiner) {
	    		        let curRemoteMinerFlagName = roomCreepQuotas.remoteMiner[curRemoteMinerIndex];
	    		        let currentFlagRemoteMiners = _.filter(roomCreeps, (creep) => creep.memory.flagName === curRemoteMinerFlagName);
	    		        if((currentFlagRemoteMiners.length < 1) || (currentFlagRemoteMiners[0].ticksToLive <= ((remoteMinerBody.length * 3) + 25))) {
							if(Game.flags[curRemoteMinerFlagName].memory.bodyParts) {
								remoteMinerBody = Game.flags[curRemoteMinerFlagName].memory.bodyParts;
							}
	    		            let newName = mainSpawn.createCreep(remoteMinerBody, undefined, {spawnRoom: roomName, role: 'remoteMiner', flagName: curRemoteMinerFlagName});
	    			        console.log('Spawning new remote miner: ' + newName + ' - ' + curRemoteMinerFlagName);
	    			        break;
	    		        }
	    		    }
	    		} else if((roomCreepQuotas.remoteCarrier) && (undefToZero(roomCreepRoster.remoteCarrier) < roomCreepQuotas.remoteCarrier.length)) {
					for(let curRemoteCarrierIndex in roomCreepQuotas.remoteCarrier) {
	    		        let curRemoteCarrierFlagName = roomCreepQuotas.remoteCarrier[curRemoteCarrierIndex];
	    		        let currentFlagRemoteCarriers = _.filter(roomCreeps, (creep) => creep.memory.flagName === curRemoteCarrierFlagName);
	    		        if((currentFlagRemoteCarriers.length < 1) || (currentFlagRemoteCarriers[0].ticksToLive <= ((remoteCarrierBody.length * 3) + 25))) {
							if(Game.flags[curRemoteCarrierFlagName].memory.bodyParts) {
								remoteCarrierBody = Game.flags[curRemoteCarrierFlagName].memory.bodyParts;
							}
	    		            let newName = mainSpawn.createCreep(remoteCarrierBody, undefined, {spawnRoom: roomName, role: 'remoteCarrier', flagName: curRemoteCarrierFlagName});
	    			        console.log('Spawning new remote carrier: ' + newName + ' - ' + curRemoteCarrierFlagName);
	    			        break;
	    		        }
	    		    }
	    		} else if(undefToZero(roomCreepRoster.reserver) < roomQuota.reservers) {
	    			if(roomRemoteInfo && (roomRemoteInfo.reservers.length > 0)) {
	    				for(let reserversIndex in roomRemoteInfo.reservers) {
	    					let currentReserver = roomRemoteInfo.reservers[reserversIndex];
	    					let currentReserverFilter = _.filter(roomCreeps, (creep) => creep.memory.creepId === currentReserver.creepId);

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
	    		} else if(undefToZero(roomCreepRoster.reinforcer) < roomQuota.reinforcers) {
	    			let newName = mainSpawn.createCreep([WORK,MOVE,CARRY,MOVE,WORK,MOVE,CARRY,MOVE,CARRY,MOVE], undefined, {role: 'reinforcer', spawnRoom: roomName});
	    			console.log('Spawning new reinforcer (' + roomName + '): ' + newName);
	    		} else if(undefToZero(roomCreepRoster.claimer) < roomQuota.claimers) {
	    			let newName = mainSpawn.createCreep([CLAIM,MOVE], undefined, {role: 'claimer', spawnRoom: roomName});
	    			console.log('Spawning new claimer (' + roomName + '): ' + newName);
	    		} else if(undefToZero(roomCreepRoster.remoteUpgrader) < roomQuota.remoteUpgraders) {
	    			let newName = mainSpawn.createCreep(currentBody, undefined, {role: 'remoteUpgrader', spawnRoom: roomName});
	    			console.log('Spawning new remote upgrader (' + roomName + '): ' + newName);
	    		} else if(undefToZero(roomCreepRoster.remoteBuilder) < roomQuota.remoteBuilders) {
	    			let newName = mainSpawn.createCreep(currentBody, undefined, {role: 'remoteBuilder', spawnRoom: roomName});
	    			console.log('Spawning new remote builder (' + roomName + '): ' + newName);
	    		} else if(undefToZero(roomCreepRoster.mineralHarvester) < roomQuota.mineralHarvesters) {
	    		    mainSpawn.spawnMineralHarvester();
	    		}  else if((roomCreepQuotas.scout) && (undefToZero(roomCreepRoster.scout) < roomCreepQuotas.scout.length)) {
	    		    for(let curScoutIndex in roomCreepQuotas.scout) {
	    		        let curScoutFlagName = roomCreepQuotas.scout[curScoutIndex];
	    		        let currentFlagScouts = _.filter(roomCreeps, (creep) => creep.memory.flagName === curScoutFlagName);
	    		        if((currentFlagScouts.length < 1) || (currentFlagScouts[0].ticksToLive <= 20)) {
	    		            let newName = mainSpawn.createCreep([MOVE], undefined, {spawnRoom: roomName, role: 'scout', flagName: curScoutFlagName});
	    			        console.log('Spawning new scout: ' + newName + ' - ' + curScoutFlagName);
	    			        break;
	    		        }
	    		    }
	    		}  else if((roomCreepQuotas.soldier) && (undefToZero(roomCreepRoster.soldier) < roomCreepQuotas.soldier.length)) {
	    		    for(let curSoldierIndex in roomCreepQuotas.soldier) {
	    		        let curSoldierFlagName = roomCreepQuotas.soldier[curSoldierIndex];
	    		        let currentFlagSoldiers = _.filter(roomCreeps, (creep) => creep.memory.flagName === curSoldierFlagName);
	    		        if((currentFlagSoldiers.length < 1) || (currentFlagSoldiers[0].ticksToLive <= 25)) {
							let soldierBody = [TOUGH,MOVE,ATTACK,MOVE];
							if(Game.flags[curSoldierFlagName].memory.bodyParts) {
								soldierBody = Game.flags[curSoldierFlagName].memory.bodyParts;
							}
	    		            let newName = mainSpawn.createCreep(soldierBody, undefined, {spawnRoom: roomName, role: 'soldier', flagName: curSoldierFlagName});
	    			        console.log('Spawning new soldier: ' + newName + ' - ' + curSoldierFlagName);
	    			        break;
	    		        }
	    		    }
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

				//let nonFullCarriers = _.filter(roomCreeps, (creep) => {
				//		return (creep.memory.role === 'carrier') && (creep.carry.energy < creep.carryCapacity);
				//});

				let nonFullBuilders = _.filter(roomCreeps, (creep) => {
						return (creep.memory.role === 'builder') && (creep.carry.energy < creep.carryCapacity);
						//return (creep.memory.role === 'builder') && (creep.carry.energy === 0);
				});

				//let nonFullReinforcers = _.filter(roomCreeps, (creep) => {
				//		return (creep.memory.role === 'reinforcer') && (creep.carry.energy === 0);
				//});

				//let inRangeCarriers = mainStorage.pos.findInRange(nonFullCarriers, 1);
				// EDITS
				let inRangeBuildersPreSort = mainStorage.pos.findInRange(nonFullBuilders, 1);
				let inRangeBuilders = _.sortBy(inRangeBuildersPreSort, function(inRangeBuilder) { return inRangeBuilder.carry.energy; });
				//let inRangeReinforcers = mainStorage.pos.findInRange(nonFullReinforcers, 1);

				//if(inRangeCarriers.length > 0) {
				//	if(mainStorage.transfer(inRangeCarriers[0], RESOURCE_ENERGY) === OK) {
				//		//console.log('storage energy transferred to: ' + inRangeCarriers[0].name + ' - ' + inRangeCarriers[0].memory.role);
				//	}
				//} else
				if(inRangeBuilders.length > 0) {
					if(mainStorage.transfer(inRangeBuilders[0], RESOURCE_ENERGY) === OK) {
						//console.log('storage energy transferred to: ' + inRangeBuilders[0].name + ' - ' + inRangeBuilders[0].memory.role);
					}
				}// else if(inRangeReinforcers.length > 0) {
				//	if(mainStorage.transfer(inRangeReinforcers[0], RESOURCE_ENERGY) === OK) {
						//console.log('storage energy transferred to: ' + inRangeReinforcers[0].name + ' - ' + inRangeReinforcers[0].memory.role);
				//	}
				//}
			}

			// find non carriers that aren't full of energy
			let nonCarriers = _.filter(roomCreeps, (creep) => {
					return (creep.memory.role !== 'remoteCarrier') && (creep.memory.role !== 'carrier') && (creep.memory.role !== 'explorer') && (creep.memory.role !== 'reinforcer') && (creep.memory.role !== 'mineralHarvester') && (creep.memory.role !== 'miner') && (creep.carry.energy < creep.carryCapacity);
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
						//console.log('link energy transferred to: ' + inRangeCreeps[0].name + ' - ' + inRangeCreeps[0].memory.role);
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
				} else if(creep.memory.role == 'carrier') {
					creep.run();
					Memory.roster[creep.pos.roomName].carriers++;
				} else if(creep.memory.role == 'linker') {
					creep.run();
					Memory.roster[creep.pos.roomName].linkers++;
				} else if(creep.memory.role == 'harvester') {
					creep.run();
					Memory.roster[creep.pos.roomName].harvesters++;
				} else if(creep.memory.role == 'upgrader') {
					roleUpgrader.run(creep);
					Memory.roster[creep.pos.roomName].upgraders++;
				} else if(creep.memory.role == 'builder') {
					creep.run();
					Memory.roster[creep.pos.roomName].builders++;
				} else if(creep.memory.role == 'defender') {
					roleDefender.run(creep);
					Memory.roster[creep.pos.roomName].defenders++;
				} else if(creep.memory.role == 'explorer') {
					roleExplorer.run(creep);
					Memory.roster[creep.pos.roomName].explorers++;
				} else if(creep.memory.role == 'remoteMiner') {
					creep.run();
					Memory.roster[creep.pos.roomName].remoteMiners++;
				} else if(creep.memory.role == 'remoteCarrier') {
					creep.run();
					Memory.roster[creep.pos.roomName].remoteCarriers++;
				} else if(creep.memory.role == 'reserver') {
					roleReserver.run(creep);
					Memory.roster[creep.pos.roomName].reservers++;
				} else if(creep.memory.role == 'reinforcer') {
					creep.run();
					Memory.roster[creep.pos.roomName].reinforcers++;
				} else if(creep.memory.role == 'claimer') {
					roleClaimer.run(creep);
					Memory.roster[creep.pos.roomName].claimers++;
				} else if(creep.memory.role == 'remoteUpgrader') {
					roleRemoteUpgrader.run(creep);
					Memory.roster[creep.pos.roomName].remoteUpgraders++;
				} else if(creep.memory.role == 'remoteBuilder') {
					roleRemoteBuilder.run(creep);
					Memory.roster[creep.pos.roomName].remoteBuilders++;
				} else if(creep.memory.role == 'mineralHarvester') {
					creep.run();
					Memory.roster[creep.pos.roomName].mineralHarvesters++;
				} else {
					creep.run();
				}
			} else {
				// this is a test that will break when there are multiple spawns working and will remain when nothing is spawning
				// TODO fix this to be better
				Memory.creepSpawning = creep.memory.role;
			}
	    }
	});
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
					return (structure.structureType == STRUCTURE_RAMPART) && structure.hits < 50000;
				}
		});
		let sortedRamparts = _.sortBy(ramparts, function(rampart) { return rampart.hits; });

		let walls = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_WALL) && structure.hits < 50000;
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

//function undefToZero(x) {
//	return x || 0;
//}

var reset_memory = function () {
	let default_keys = ['creeps', 'spawn', 'rooms', 'flags'];
	let keys = Object.keys(Memory);
	for(let key_index in keys) {
		let key = keys[key_index];
		delete Memory[key];
	}

	for(let key_index in default_keys) {
		let key = default_keys[key_index];
		Memory[key] = {};
	}

	return true;
};

//module.exports = reset_memory;

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
