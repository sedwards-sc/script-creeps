/* jshint esversion: 6, loopfunc: true */

require('utils').populateUtils(global);

require('prototype.room');
require('prototype.creep');
require('prototype.flag');
require('prototype.structure');
require('prototype.spawn');
require('prototype.link');
require('prototype.terminal');

require('object.rosters');
require('object.remotes');

var ScreepsStats = require('screepsstats');
global.Stats = new ScreepsStats();

require('debug').populate(global);

var profiler = require('screeps-profiler');

if(Memory.enableProfiler === true) {
	profiler.enable();
}

module.exports.loop = function () {
	profiler.wrap(function() {
	    console.log(Game.time);

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
			countAllCreepFlags();
		}

		// report gcl progress occasionally
		if((Game.time % 1500) === 1) {
		    Game.notify('GCL - level: ' + Game.gcl.level + ' - progress: ' + (Game.gcl.progress / 1000000).toFixed(2) + 'M - required: ' + (Game.gcl.progressTotal / 1000000).toFixed(2) + 'M - ' + ((Game.gcl.progress / Game.gcl.progressTotal) * 100).toFixed(1) + '%');
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

		let roomQuotas = new WorldRoster();
		let remoteInfo = new RoomRemotes();

		// room spawn loop
		for(let roomName in Game.rooms) {
			let curRoom = Game.rooms[roomName];

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

			// gather room info
			let controllerProgress = (Game.rooms[roomName].controller.progress / Game.rooms[roomName].controller.progressTotal * 100).toFixed(2);
			let roomEnergy = Game.rooms[roomName].energyAvailable;
			let roomEnergyCapacity = Game.rooms[roomName].energyCapacityAvailable;
			let roomStorageEnergy;
			if(Game.rooms[roomName].storage) {
				roomStorageEnergy = Game.rooms[roomName].storage.store[RESOURCE_ENERGY];
			}

			// print update but not every tick so console doesn't scroll as fast
			if((Game.time % 5) === 1) {
				console.log(roomName + ' - energy avail: ' + roomEnergy + ' / ' + roomEnergyCapacity + ' - storage energy: ' + roomStorageEnergy + ' - controller progress: ' + controllerProgress + '%');
			}

			// send update email occasionally
			if((Game.time % 1500) === 1) {
				Game.notify(roomName + ' - energy avail: ' + roomEnergy + ' / ' + roomEnergyCapacity + ' - storage energy: ' + roomStorageEnergy + ' - controller progress: ' + controllerProgress + '% - time: ' + Game.time);
			}

			// get the roster of creeps for the current room
			Game.rooms[roomName].countCreepRoles();

			// find room creeps
			let roomCreeps = _.filter(Game.creeps, (creep) => creep.memory.spawnRoom == roomName);

			// note: top level parts upgrade may not be necessary for harvesters (source already runs out sometimes)
			// quick fix to stop from quickly making weak creeps in a row before extensions can be refilled (still need to recover is creeps are wiped)
			// TODO: check which of this body code can be deprecated
	        let currentBody;
	        let currentHarvesterBody;
			if(undefToZero(Game.rooms[roomName].memory.creepRoster.carrier) > 1) {
				currentBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
				currentHarvesterBody = [WORK,CARRY,MOVE,MOVE];
				if(roomEnergy >= 1350) {
				    currentBody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
				} else if(roomEnergy >= 950) {
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
			if(roomEnergyCapacity >= 950) {
			    upgraderBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
			} else if(roomEnergyCapacity >= 850) {
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
			if(Game.rooms[roomName].controller.level === 8) {
				carrierBody = [CARRY,CARRY,MOVE,MOVE,CARRY,CARRY,MOVE,MOVE,CARRY,CARRY,MOVE,MOVE,CARRY,CARRY,MOVE,MOVE];
			} else if(roomEnergy >= 400) {
				carrierBody = [CARRY,CARRY,MOVE,MOVE,CARRY,CARRY,MOVE,MOVE];
			} else {
				carrierBody = [CARRY,CARRY,MOVE,MOVE];
			}

			let minerBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE];

	        let builderBody;
			if(Game.rooms[roomName].controller.level === 8) {
				builderBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
			} else if((roomEnergyCapacity >= 1900) && (roomStorageEnergy > 500000)) {
				builderBody = [WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,MOVE,CARRY,MOVE];
			} else if((roomEnergyCapacity >= 950) && (roomStorageEnergy > 100000)) {
				builderBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
			} else if(roomEnergyCapacity >= 500) {
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

			//let remoteMinerBody = [WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK];
			let remoteMinerBody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,ATTACK];
			let remoteCarrierBody = [CARRY,CARRY,MOVE,MOVE,CARRY,CARRY,MOVE,MOVE,MOVE,ATTACK];

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
						let currentBody;
						if(Game.flags[curBuilderFlagName].memory.bodyParts) {
							currentBody = Game.flags[curBuilderFlagName].memory.bodyParts;
						} else {
							currentBody = builderBody;
						}
	    		        if((currentFlagBuilders.length < 1) || (currentFlagBuilders[0].ticksToLive <= (currentBody.length * 3))) {
	    		            let newName = mainSpawn.createCreep(currentBody, undefined, {spawnRoom: roomName, role: 'builder', flagName: curBuilderFlagName});
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
	    		} else if(undefToZero(roomCreepRoster.reinforcer) < roomQuota.reinforcers) {
	    			let newName = mainSpawn.createCreep([WORK,MOVE,CARRY,MOVE,WORK,MOVE,CARRY,MOVE,CARRY,MOVE], undefined, {role: 'reinforcer', spawnRoom: roomName});
	    			console.log('Spawning new reinforcer (' + roomName + '): ' + newName);
	    		} else if(undefToZero(roomCreepRoster.claimer) < roomQuota.claimers) {
	    			//let newName = mainSpawn.createCreep([CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,MOVE,MOVE,MOVE,MOVE,MOVE], undefined, {role: 'claimer', spawnRoom: roomName});
	    			let newName = mainSpawn.createCreep([CLAIM,MOVE], undefined, {role: 'claimer', spawnRoom: roomName});
	    			console.log('Spawning new claimer (' + roomName + '): ' + newName);
	    		} else if(undefToZero(roomCreepRoster.remoteUpgrader) < roomQuota.remoteUpgraders) {
	    			let newName = mainSpawn.createCreep(currentBody, undefined, {role: 'remoteUpgrader', spawnRoom: roomName});
	    			console.log('Spawning new remote upgrader (' + roomName + '): ' + newName);
	    		} else if(undefToZero(roomCreepRoster.remoteBuilder) < roomQuota.remoteBuilders) {
	    			let newName = mainSpawn.createCreep(currentBody, undefined, {role: 'remoteBuilder', spawnRoom: roomName});
	    			//let newName = mainSpawn.createCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], undefined, {role: 'remoteBuilder', spawnRoom: roomName});
	    			console.log('Spawning new remote builder (' + roomName + '): ' + newName);
	    		} else if(undefToZero(roomCreepRoster.mineralHarvester) < roomQuota.mineralHarvesters) {
	    		    mainSpawn.spawnMineralHarvester();
	    		}  else if((roomCreepQuotas.scout) && (undefToZero(roomCreepRoster.scout) < roomCreepQuotas.scout.length)) {
	    		    for(let curScoutIndex in roomCreepQuotas.scout) {
	    		        let curScoutFlagName = roomCreepQuotas.scout[curScoutIndex];
	    		        let currentFlagScouts = _.filter(roomCreeps, (creep) => creep.memory.flagName === curScoutFlagName);
	    		        if((currentFlagScouts.length < 1) || (currentFlagScouts[0].ticksToLive <= 20)) {
	    		            //let newName = mainSpawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], undefined, {spawnRoom: roomName, role: 'scout', flagName: curScoutFlagName});
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
	    		} else {
					// filter for room mineral transfer or return flags
					let roomTransferFlagRegex = new RegExp('^' + roomName + '_mineralTransfer_');
					let roomReturnFlagRegex = new RegExp('^' + roomName + '_mineralReturn_');
					let roomTransferFlags = _.filter(Game.flags, (flag) => {
						return (roomTransferFlagRegex.test(flag.name) === true) || (roomReturnFlagRegex.test(flag.name) === true);
					});

					if(roomTransferFlags.length) {
						let creepName = roomName + '_mineralCarrier';
						if(!Game.creeps[creepName]) {
							let newName = mainSpawn.createCreep([CARRY,CARRY,MOVE,MOVE], creepName, {spawnRoom: roomName, role: 'mineralCarrier'});
	    			        console.log('Spawning new mineral carrier: ' + newName + ' (' + roomName + ')');
						}
					}
				}
			}

			if(roomSpawns.length >= 2) {
			    mainSpawn = roomSpawns[1];
			}

			let numMedics = 0;

			if((!mainSpawn.spawnCalled) && ((mainSpawn.spawning === null) || (mainSpawn.spawning === undefined))) {
				let roomCreepRoster = Game.rooms[roomName].memory.creepRoster;
				let roomCreepQuotas = Game.rooms[roomName].memory.creepQuotas;
				if((roomCreepQuotas.dismantler) && (undefToZero(roomCreepRoster.medic) < (roomCreepQuotas.dismantler.length * numMedics))) {
	    		    for(let curQuotaIndex in roomCreepQuotas.dismantler) {
	    		        let curFlagName = roomCreepQuotas.dismantler[curQuotaIndex];
	    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === 'medic'));
	    		        if(currentFlagCreeps.length < numMedics) {
							//let medicBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL];
							let medicBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL];
							if(Game.flags[curFlagName].memory.medicBodyParts) {
								medicBody = Game.flags[curFlagName].memory.medicBodyParts;
							}
	    		            let newName = mainSpawn.createCreep(medicBody, undefined, {spawnRoom: roomName, role: 'medic', flagName: curFlagName});
	    			        console.log('Spawning new medic: ' + newName + ' - ' + curFlagName);
	    			        break;
	    		        }
	    		    }
	    		}  else if((roomCreepQuotas.dismantler) && (undefToZero(roomCreepRoster.dismantler) < roomCreepQuotas.dismantler.length)) {
					let curRole = 'dismantler';
	    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
	    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
	    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
	    		        if(currentFlagCreeps.length < 1) {
							let curCreepBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK];
							if(Game.flags[curFlagName].memory.dismantlerBodyParts) {
								curCreepBody = Game.flags[curFlagName].memory.dismantlerBodyParts;
							}
	    		            let newName = mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
	    			        console.log('Spawning new ' + curRole + ': ' + newName + ' - ' + curFlagName);
	    			        break;
	    		        }
	    		    }
	    		}
			}


			// run links
			let links = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_LINK}});
			links.forEach(link => link.run());

			// transfer energy from links to any creeps except carriers, miners, and various special roles
			// find non carriers that aren't full of energy
			let linkTransferCandidates = _.filter(roomCreeps, (creep) => {
					return (creep.memory.role !== 'remoteCarrier') && (creep.memory.role !== 'carrier') && (creep.memory.role !== 'explorer') && (creep.memory.role !== 'reinforcer') && (creep.memory.role !== 'mineralHarvester') && (creep.memory.role !== 'miner') && (creep.memory.role !== 'mineralCarrier') && (creep.memory.role !== 'harvester') && (creep.carry.energy < creep.carryCapacity);
			});

			links.forEach(link => link.refillCreeps(linkTransferCandidates));

			if(curRoom.terminal) {
				curRoom.terminal.run();
			}


			if(typeof curRoom.memory.reactors !== 'undefined') {
			    for(let reactorIndex in curRoom.memory.reactors) {
			        let curReactorGroup = curRoom.memory.reactors[reactorIndex];

			        let curReactor = Game.getObjectById(curReactorGroup.reactorId);
			        if(curReactor === null) {
			            //TODO: make this work if there are ramparts on top
			            curReactor = curRoom.lookForAt(LOOK_STRUCTURES, Game.flags[curReactorGroup.reactorFlagName].pos)[0];
			            if(curReactor.structureType === STRUCTURE_LAB) {
			                curReactorGroup.reactorId = curReactor.id;
			            } else {
			                console.log('!!!Error: non-lab building under flag: ' + curReactorGroup.reactorFlagName);
			                continue;
			            }
			        }

			        if((curReactor.cooldown === 0) && (curReactor.mineralAmount < curReactor.mineralCapacity)) {
			            curReactorGroup.reactorSiloIds = curReactorGroup.reactorSiloIds || [];

			            let curReactorSilo0 = Game.getObjectById(curReactorGroup.reactorSiloIds[0]);
			            if(curReactorSilo0 === null) {
			                //TODO: make this work if there are ramparts on top
    			            curReactorSilo0 = curRoom.lookForAt(LOOK_STRUCTURES, Game.flags[curReactorGroup.reactorSiloFlagNames[0]].pos)[0];
    			            if(curReactorSilo0.structureType === STRUCTURE_LAB) {
    			                curReactorGroup.reactorSiloIds[0] = curReactorSilo0.id;
    			            } else {
    			                console.log('!!!Error: non-lab building under flag: ' + curReactorGroup.reactorSiloFlagNames[0]);
    			                continue;
    			            }
			            }

			            let curReactorSilo1 = Game.getObjectById(curReactorGroup.reactorSiloIds[1]);
			            if(curReactorSilo1 === null) {
			                //TODO: make this work if there are ramparts on top
    			            curReactorSilo1 = curRoom.lookForAt(LOOK_STRUCTURES, Game.flags[curReactorGroup.reactorSiloFlagNames[1]].pos)[0];
    			            if(curReactorSilo1.structureType === STRUCTURE_LAB) {
    			                curReactorGroup.reactorSiloIds[1] = curReactorSilo1.id;
    			            } else {
    			                console.log('!!!Error: non-lab building under flag: ' + curReactorGroup.reactorSiloFlagNames[1]);
    			                continue;
    			            }
			            }

			            if((curReactorSilo0.mineralAmount > 0) && (curReactorSilo1.mineralAmount > 0)) {
			                let reactionReturn = curReactor.runReaction(curReactorSilo0, curReactorSilo1);
			                if(reactionReturn !== OK) {
			                    console.log('***Reaction Error: ' + reactionReturn + ', ' + roomName + ', ' + curReactorGroup.reactorFlagName);
			                }
			            }
			        }
			    }
			}

		}

		Memory.roster = {};

		// run creep loop
	    for(let creepName in Game.creeps) {
	        let creep = Game.creeps[creepName];

			Memory.roster[creep.pos.roomName] = Memory.roster[creep.pos.roomName] || {};

			if(!creep.spawning) {
				creep.run();
				Memory.roster[creep.pos.roomName][creep.memory.role] = Memory.roster[creep.pos.roomName][creep.memory.role] || 0;
				Memory.roster[creep.pos.roomName][creep.memory.role]++;
			} else {
				Memory.roster[creep.pos.roomName].spawning = Memory.roster[creep.pos.roomName].spawning || [];
				Memory.roster[creep.pos.roomName].spawning.push(creep.memory.role);
			}
	    }

		// run spawn loop
		for(let spawnName in Game.spawns) {
			Game.spawns[spawnName].updateSpawnFlag();
		}


	    var statsConsole = require("statsConsole");

        // sample data format ["Name for Stat", variableForStat]
        let myStats = [];
        /*let myStats = [
        	["Creep Managers", CreepManagersCPUUsage],
        	["Towers", towersCPUUsage],
        	["Links", linksCPUUsage],
        	["Setup Roles", SetupRolesCPUUsage],
        	["Creeps", CreepsCPUUsage],
        	["Init", initCPUUsage],
        	["Stats", statsCPUUsage],
        	["Total", totalCPUUsage]
        ];*/

        statsConsole.run(myStats); // Run Stats collection

        if (Game.cpu.getUsed() > Game.cpu.limit) {
        	statsConsole.log("Tick: " + Game.time + "  CPU OVERRUN: " + Game.cpu.getUsed().toFixed(2) + "  Bucket:" + Game.cpu.bucket, 5);
        }

        if ((Game.time % 5) === 0) {
            let timeBeforeDisplay = Game.cpu.getUsed();
        	console.log(statsConsole.displayHistogram());
        	console.log(statsConsole.displayStats());
        	console.log(statsConsole.displayLogs());
        	//console.log(statsConsole.displayMaps()); // Don't use as it will consume ~30-40 CPU
        	totalTimeToDisplay = (Game.cpu.getUsed() - timeBeforeDisplay);
        	console.log("Time to Draw: " + totalTimeToDisplay.toFixed(2));
        }


		Stats.runBuiltinStats(); // for screeps-stats

	});
};

function defendRoom(roomName) {

    let hostiles = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);

    if(hostiles.length > 0) {
        let username = hostiles[0].owner.username;
		let gameTime = Game.time;
		if(username !== 'Invader') {
        	Game.notify(`User ${username} spotted in room ${roomName} at ${gameTime}`);
		}
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

function countAllCreepFlags() {
	for(let name in Game.rooms) {
		if(Game.rooms[name].isMine()) {
			Game.rooms[name].countCreepFlags();
		}
	}

	return OK;
}
global.countAllCreepFlags = countAllCreepFlags;

function marketSell(room_name, resource, amt = Infinity) {
    // 9-30-2016 patch makes this way faster I guess?
    let orders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: resource});
    orders = _.filter(orders, o => o.price > 0.25);
    let order = _.max(orders, o => o.price / Game.market.calcTransactionCost(amt, room_name, o.roomName));
    console.log('Chosen order:', JSON.stringify(order));
    console.log('Transaction cost:', Game.market.calcTransactionCost(amt, room_name, order.roomName));
    if (!order || order == Infinity)
        return;

    let retval = Game.market.deal(order.id, amt, room_name);
    console.log('Deal return value:', retval);

    return retval;
}
global.marketSell = marketSell;

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

//var walls = Game.rooms[roomName].find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_WALL}});
/*
		var defenses = Game.rooms[roomName].find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) && structure.hits < 35000;
				}
		});
*/


// transfer energy from storage to carriers or reinforcers if they are in range
//let mainStorage = Game.rooms[roomName].storage;
//if(mainStorage) {

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

	//let nonFullBuilders = _.filter(roomCreeps, (creep) => {
	//		return (creep.memory.role === 'builder') && (creep.carry.energy < creep.carryCapacity);
			//return (creep.memory.role === 'builder') && (creep.carry.energy === 0);
	//});

	//let nonFullReinforcers = _.filter(roomCreeps, (creep) => {
	//		return (creep.memory.role === 'reinforcer') && (creep.carry.energy === 0);
	//});

	//let inRangeCarriers = mainStorage.pos.findInRange(nonFullCarriers, 1);
	// EDITS
	//let inRangeBuildersPreSort = mainStorage.pos.findInRange(nonFullBuilders, 1);
	//let inRangeBuilders = _.sortBy(inRangeBuildersPreSort, function(inRangeBuilder) { return inRangeBuilder.carry.energy; });
	//let inRangeReinforcers = mainStorage.pos.findInRange(nonFullReinforcers, 1);

	//if(inRangeCarriers.length > 0) {
	//	if(mainStorage.transfer(inRangeCarriers[0], RESOURCE_ENERGY) === OK) {
	//		//console.log('storage energy transferred to: ' + inRangeCarriers[0].name + ' - ' + inRangeCarriers[0].memory.role);
	//	}
	//} else
	//if(inRangeBuilders.length > 0) {
	//	if(mainStorage.transfer(inRangeBuilders[0], RESOURCE_ENERGY) === OK) {
			//console.log('storage energy transferred to: ' + inRangeBuilders[0].name + ' - ' + inRangeBuilders[0].memory.role);
	//	}
	//}// else if(inRangeReinforcers.length > 0) {
	//	if(mainStorage.transfer(inRangeReinforcers[0], RESOURCE_ENERGY) === OK) {
			//console.log('storage energy transferred to: ' + inRangeReinforcers[0].name + ' - ' + inRangeReinforcers[0].memory.role);
	//	}
	//}
//}
