/* jshint esversion: 6, loopfunc: true */

require('constants');

require('SVG');

global.Logger = require('logger');

require('utils').populateUtils(global);

global.loopHelper = require('loopHelper');
loopHelper.initMemory();

require('prototype.room');
require('prototype.roomposition');
require('prototype.creep');
require('prototype.creep.run');
require('prototype.flag');
require('prototype.structure');
require('prototype.spawn');
require('prototype.link');
require('prototype.terminal');

// require creep talk after creep prototypes
require('creeptalk')({
  'public': false,
  'language': require('creeptalk_basic')
});

require('object.rosters');
require('object.remotes');

var ScreepsStats = require('screepsstats');
global.Stats = new ScreepsStats();

require('debug').populate(global);

var profiler = require('screeps-profiler');
if(Memory.config && Memory.config.enableProfiler === true) {
	try {
		profiler.enable();
	} catch(e) {
		Logger.errorLog("could enable 'screeps-profiler'", ERR_NOT_FOUND, 5);
		Memory.config.enableProfiler = false;
	}
}

/**
 * main function called in tick loop
 */
var main = function () {
	if(Game.cpu.bucket < 2 * Game.cpu.tickLimit) {
		Logger.errorLog(`skipping tick ${Game.time} due to lack of CPU`, ERR_BUSY, 5);
		return;
	}

	Logger.log(Game.time, 3);

	// create cache for this tick
	Game.cache = {
		structures: {},
		creeps: {},
		hostiles: {},
		hostilesAndLairs: {},
		mineralCount: {},
		labProcesses: {},
		activeLabCount: 0,
		placedRoad: false,
	};

	var Traveler = require('Traveler');

	let empire = loopHelper.initEmpire();

	for(let name in Game.rooms) {
		if(Game.rooms[name].isMine()) {
			empire.register(Game.rooms[name]);
		}
	}

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
		if(Game.rooms[name].hostiles.length > 0) {
			let defenders = _.filter(Game.creeps, (creep) => {
				return (creep.memory.role === 'defender') && (creep.memory.spawnRoom === name);
			});

			if(defenders.length < 1) {
				// find room spawns
				let roomSpawns = Game.rooms[name].findStructures(STRUCTURE_SPAWN);
				if(isArrayWithContents(roomSpawns)) {
					let mainSpawn = roomSpawns[0];
					if(Game.rooms[name].energyAvailable >= 1610) {
						mainSpawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK], undefined, {spawnRoom: name, role: 'defender'});
					} else {
						mainSpawn.createCreep([TOUGH,MOVE,ATTACK,MOVE], undefined, {spawnRoom: name, role: 'defender'});
					}
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

		if(curRoom.roomType === ROOMTYPE_ALLEY) {
			// find and report on power banks
			let powerBanks = curRoom.findStructures(STRUCTURE_POWER_BANK);
			if(isArrayWithContents(powerBanks)) {
			    let powerBank = powerBanks[0];
			    if(powerBank.ticksToDecay > 3500 && powerBank.hits === powerBank.hitsMax) {
					let powerBankMsg = `power bank in ${curRoom} - power: ${powerBank.power}, ticksToDecay: ${powerBank.ticksToDecay}`;
					if(typeof curRoom.memory.powerBank === 'undefined') {
						Game.notify(powerBankMsg);
					}
					Logger.highlight(powerBankMsg);
					curRoom.memory.powerBank = {
						'power': powerBank.power,
						'ticksToDecay': powerBank.ticksToDecay,
						'time': Game.time
					};
			    }
			} else {
				delete curRoom.memory.powerBank;
			}
			continue;
		}

		// find room spawns
		let roomSpawns = Game.rooms[roomName].find(FIND_MY_SPAWNS);

		// get room creep role quota and remote info for this room
		let roomQuota = roomQuotas[roomName];
		let roomRemoteInfo = remoteInfo[roomName];

		// continue to next room if there are no spawns or no room quota
		if(roomSpawns.length < 1) {
		    continue;
		} else if(roomQuota === undefined) {
			Logger.errorLog(`${curRoom} has spawn but no quota`, ERR_NOT_FOUND, 4);
			continue;
		}

		//if((roomSpawns.length >= 2) && (roomSpawns[0].spawning)) {
		//    var mainSpawn = roomSpawns[1];
		//} else {
		    let mainSpawn = roomSpawns[0];
		//}

		// check the mineral status of the room and if it should be mined (based on storage amount)
		curRoom.checkMineralStatus();

		// gather room info
		let controllerProgress = (Game.rooms[roomName].controller.progress / Game.rooms[roomName].controller.progressTotal * 100).toFixed(2);
		let roomEnergy = Game.rooms[roomName].energyAvailable;
		let roomEnergyCapacity = Game.rooms[roomName].energyCapacityAvailable;
		let roomStorageEnergy;
		let roomStoragePower;
		if(Game.rooms[roomName].storage) {
			roomStorageEnergy = undefToZero(Game.rooms[roomName].storage.store.energy);
			roomStoragePower = undefToZero(Game.rooms[roomName].storage.store.power);
		}

		// print update but not every tick so console doesn't scroll as fast
		if((Game.time % 5) === 1) {
			Logger.log(roomName + ' - energy avail: ' + roomEnergy + ' / ' + roomEnergyCapacity + ' - storage energy / power: ' + roomStorageEnergy + ' / ' + roomStoragePower + ' - controller progress: ' + controllerProgress + '%', 2);
		}

		// send update email occasionally
		if((Game.time % 1500) === 1) {
			Game.notify(roomName + ' - energy avail: ' + roomEnergy + ' / ' + roomEnergyCapacity + ' - storage energy / power: ' + roomStorageEnergy + ' / ' + roomStoragePower + ' - controller progress: ' + controllerProgress + '% - time: ' + Game.time);
		}

		curRoom.drawRoomStats();

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
			if(undefToZero(Game.rooms[roomName].memory.creepRoster.carrier) === 0 && roomEnergy < 800) {
				if(roomEnergy >= 400) {
					carrierBody = [CARRY,CARRY,MOVE,MOVE,CARRY,CARRY,MOVE,MOVE];
				} else {
					carrierBody = [CARRY,CARRY,MOVE,MOVE];
				}
			}
		} else if(roomEnergy >= 400) {
			carrierBody = [CARRY,CARRY,MOVE,MOVE,CARRY,CARRY,MOVE,MOVE];
		} else {
			carrierBody = [CARRY,CARRY,MOVE,MOVE];
		}

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
    			//let newName =
				mainSpawn.createCreep(carrierBody, undefined, {role: 'carrier', spawnRoom: roomName});
    			//console.log('Spawning new carrier (' + roomName + '): ' + newName);
    		} else if((roomCreepQuotas.miner) && (undefToZero(roomCreepRoster.miner) < roomCreepQuotas.miner.length)) {
				let curRole = 'miner';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = [MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,WORK,WORK,WORK,WORK,WORK];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        break;
    		        }
    		    }
    		} else if((roomCreepQuotas.linker) && (undefToZero(roomCreepRoster.linker) < roomCreepQuotas.linker.length)) {
				let curRole = 'linker';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = [CARRY,CARRY,CARRY,CARRY,MOVE];
						if(curRoom.controller.level === 8) {
							curCreepBody = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE];
						}
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
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
    		            //let newName =
						mainSpawn.createCreep(currentBody, undefined, {spawnRoom: roomName, role: 'builder', flagName: curBuilderFlagName});
    			        //console.log('Spawning new builder: ' + newName + ' - ' + curBuilderFlagName);
    			        break;
    		        }
    		    }
    		} else if(undefToZero(roomCreepRoster.upgrader) < roomQuota.upgraders) {
    			//let newName =
				mainSpawn.createCreep(upgraderBody, undefined, {role: 'upgrader', spawnRoom: roomName});
    			//console.log('Spawning new upgrader (' + roomName + '): ' + newName);
    		} else if(undefToZero(roomCreepRoster.explorer) < roomQuota.explorers) {
    			//let newName =
				mainSpawn.createCreep(explorerBody, undefined, {role: 'explorer', spawnRoom: roomName});
    			//console.log('Spawning new explorer (' + roomName + '): ' + newName);
    		} else if((roomCreepQuotas.remoteMiner) && (undefToZero(roomCreepRoster.remoteMiner) < roomCreepQuotas.remoteMiner.length)) {
				for(let curRemoteMinerIndex in roomCreepQuotas.remoteMiner) {
    		        let curRemoteMinerFlagName = roomCreepQuotas.remoteMiner[curRemoteMinerIndex];
    		        let currentFlagRemoteMiners = _.filter(roomCreeps, (creep) => creep.memory.flagName === curRemoteMinerFlagName);
    		        if((currentFlagRemoteMiners.length < 1) || (currentFlagRemoteMiners[0].ticksToLive <= ((remoteMinerBody.length * 3) + 25))) {
						if(Game.flags[curRemoteMinerFlagName].memory.bodyParts) {
							remoteMinerBody = Game.flags[curRemoteMinerFlagName].memory.bodyParts;
						}
    		            //let newName =
						mainSpawn.createCreep(remoteMinerBody, undefined, {spawnRoom: roomName, role: 'remoteMiner', flagName: curRemoteMinerFlagName});
    			        //console.log('Spawning new remote miner: ' + newName + ' - ' + curRemoteMinerFlagName);
    			        break;
    		        }
    		    }
			} else if((roomCreepQuotas.containerMiner) && (undefToZero(roomCreepRoster.containerMiner) < roomCreepQuotas.containerMiner.length)) {
				let curRole = 'containerMiner';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,WORK,WORK,WORK,WORK,WORK,WORK];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
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
    		            //let newName =
						mainSpawn.createCreep(remoteCarrierBody, undefined, {spawnRoom: roomName, role: 'remoteCarrier', flagName: curRemoteCarrierFlagName});
    			        //console.log('Spawning new remote carrier: ' + newName + ' - ' + curRemoteCarrierFlagName);
    			        break;
    		        }
    		    }
			} else if((roomCreepQuotas.remoteCart) && (undefToZero(roomCreepRoster.remoteCart) < roomCreepQuotas.remoteCart.length)) {
				let curRole = 'remoteCart';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = [CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        break;
    		        }
    		    }
			} else if((roomCreepQuotas.reserver) && (undefToZero(roomCreepRoster.reserver) < roomCreepQuotas.reserver.length)) {
			/*
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
				*/

				let curRole = 'reserver';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = [CLAIM,CLAIM,MOVE,MOVE];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
    		            //let newName =
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        //console.log('Spawning new ' + curRole + ': ' + newName + ' - ' + curFlagName);
    			        break;
    		        }
    		    }
			} else if((roomCreepQuotas.paver) && (undefToZero(roomCreepRoster.paver) < roomCreepQuotas.paver.length)) {
				let curRole = 'paver';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = [CARRY,CARRY,CARRY,WORK,MOVE,MOVE];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						} else if(Game.flags[curFlagName].room) {
							let roads = Game.flags[curFlagName].room.findStructures(STRUCTURE_ROAD);
							let sum = 0;
							for(let road of roads) {
								sum += road.hitsMax;
							}
							let potency = Math.max(Math.ceil(sum / 500000), 1);
							curCreepBody = workerBody(3 * potency, potency, 2 * potency);
						}
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        break;
    		        }
    		    }
    		} else if(undefToZero(roomCreepRoster.reinforcer) < roomQuota.reinforcers) {
    			//let newName =
				mainSpawn.createCreep([WORK,MOVE,CARRY,MOVE,WORK,MOVE,CARRY,MOVE,CARRY,MOVE], undefined, {role: 'reinforcer', spawnRoom: roomName});
    			//console.log('Spawning new reinforcer (' + roomName + '): ' + newName);
    		} else if((roomCreepQuotas.claimer) && (undefToZero(roomCreepRoster.claimer) < roomCreepQuotas.claimer.length)) {
				//} else if(undefToZero(roomCreepRoster.claimer) < roomQuota.claimers) {
    			//let newName =
    			//mainSpawn.createCreep([CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,MOVE,MOVE,MOVE,MOVE,MOVE], undefined, {role: 'claimer', spawnRoom: roomName});
    			//let newName =
				//mainSpawn.createCreep([CLAIM,MOVE], undefined, {role: 'claimer', spawnRoom: roomName});
    			//console.log('Spawning new claimer (' + roomName + '): ' + newName);
				let curRole = 'claimer';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = [CLAIM,MOVE];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        break;
    		        }
    		    }
			} else if((roomCreepQuotas.attackClaimer) && (undefToZero(roomCreepRoster.attackClaimer) < roomCreepQuotas.attackClaimer.length)) {
				let curRole = 'attackClaimer';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = [CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,MOVE,MOVE,MOVE,MOVE,MOVE];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        break;
    		        }
    		    }
    		} else if(undefToZero(roomCreepRoster.remoteUpgrader) < roomQuota.remoteUpgraders) {
    			//let newName =
				mainSpawn.createCreep(currentBody, undefined, {role: 'remoteUpgrader', spawnRoom: roomName});
    			//console.log('Spawning new remote upgrader (' + roomName + '): ' + newName);
			} else if((roomCreepQuotas.remoteBuilder) && (undefToZero(roomCreepRoster.remoteBuilder) < roomCreepQuotas.remoteBuilder.length)) {
				let curRole = 'remoteBuilder';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = currentBody;
						//let curCreepBody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        break;
    		        }
    		    }
			} else if((roomCreepQuotas.containerBuilder) && (undefToZero(roomCreepRoster.containerBuilder) < roomCreepQuotas.containerBuilder.length)) {
				let curRole = 'containerBuilder';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = currentBody;
						//let curCreepBody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        break;
    		        }
    		    }
    		} else if(curRoom.memory.shouldMine === true && undefToZero(roomCreepRoster.mineralHarvester) < 1) {
    		    mainSpawn.spawnMineralHarvester();
    		} else if((roomCreepQuotas.scout) && (undefToZero(roomCreepRoster.scout) < roomCreepQuotas.scout.length)) {
    		    for(let curScoutIndex in roomCreepQuotas.scout) {
    		        let curScoutFlagName = roomCreepQuotas.scout[curScoutIndex];
    		        let currentFlagScouts = _.filter(roomCreeps, (creep) => creep.memory.flagName === curScoutFlagName);
    		        if((currentFlagScouts.length < 1) || (currentFlagScouts[0].ticksToLive <= 20)) {
    		            //let newName = mainSpawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], undefined, {spawnRoom: roomName, role: 'scout', flagName: curScoutFlagName});
    		            //let newName =
						mainSpawn.createCreep([MOVE], undefined, {spawnRoom: roomName, role: 'scout', flagName: curScoutFlagName});
    			        //console.log('Spawning new scout: ' + newName + ' - ' + curScoutFlagName);
    			        break;
    		        }
    		    }
    		} else if((roomCreepQuotas.soldier) && (undefToZero(roomCreepRoster.soldier) < roomCreepQuotas.soldier.length)) {
    		    for(let curSoldierIndex in roomCreepQuotas.soldier) {
    		        let curSoldierFlagName = roomCreepQuotas.soldier[curSoldierIndex];
    		        let currentFlagSoldiers = _.filter(roomCreeps, (creep) => creep.memory.flagName === curSoldierFlagName);
    		        if((currentFlagSoldiers.length < 1) || (currentFlagSoldiers[0].ticksToLive <= 25)) {
						let soldierBody = [TOUGH,MOVE,ATTACK,MOVE];
						if(Game.flags[curSoldierFlagName].memory.bodyParts) {
							soldierBody = Game.flags[curSoldierFlagName].memory.bodyParts;
						}
    		            //let newName =
						mainSpawn.createCreep(soldierBody, undefined, {spawnRoom: roomName, role: 'soldier', flagName: curSoldierFlagName});
    			        //console.log('Spawning new soldier: ' + newName + ' - ' + curSoldierFlagName);
    			        break;
    		        }
    		    }
			} else if((roomCreepQuotas.powerCarrier) && (undefToZero(roomCreepRoster.powerCarrier) < roomCreepQuotas.powerCarrier.length)) {
				let curRole = 'powerCarrier';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = [CARRY,MOVE,CARRY,MOVE];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
    		            //let newName =
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        //console.log('Spawning new ' + curRole + ': ' + newName + ' - ' + curFlagName);
    			        break;
    		        }
    		    }
			} else if((roomCreepQuotas.remoteTransporter) && (undefToZero(roomCreepRoster.remoteTransporter) < roomCreepQuotas.remoteTransporter.length)) {
				let curRole = 'remoteTransporter';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = [CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
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
						//let newName = mainSpawn.createCreep([CARRY,CARRY,MOVE,MOVE], creepName, {spawnRoom: roomName, role: 'mineralCarrier'});
						//let newName =
						mainSpawn.createCreep([CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE], creepName, {spawnRoom: roomName, role: 'mineralCarrier'});
    			        //console.log('Spawning new mineral carrier: ' + newName + ' (' + roomName + ')');
					}
				}
			}
		}

		if(roomSpawns.length >= 2) {
		    mainSpawn = roomSpawns[1];
		}

		if(mainSpawn.spawnCalled || mainSpawn.spawning) {
			if(roomSpawns.length >= 3) {
			    mainSpawn = roomSpawns[2];
			}
	    }



		// for sentinels
		if((!mainSpawn.spawnCalled) && ((mainSpawn.spawning === null) || (mainSpawn.spawning === undefined))) {
			let roomCreepRoster = Game.rooms[roomName].memory.creepRoster;
			let roomCreepQuotas = Game.rooms[roomName].memory.creepQuotas;
			if((roomCreepQuotas.sentinel) && (undefToZero(roomCreepRoster.sentinel) < roomCreepQuotas.sentinel.length)) {
				let curRole = 'sentinel';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
					if(Game.flags[curFlagName].room && Game.flags[curFlagName].room.hostiles.length > 0) {
						let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
	    		        if(currentFlagCreeps.length < 1) {
							let curCreepBody = [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,HEAL,HEAL,HEAL];
							if(Game.flags[curFlagName].memory.bodyParts) {
								curCreepBody = Game.flags[curFlagName].memory.bodyParts;
							}
							mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
							Logger.log(`sentinel activated for flag ${curFlagName}`, 4);
	    			        break;
	    		        }
					}
    		    }
			}
		}



		// for dismantlers
		let numMedics = 0;

		if((!mainSpawn.spawnCalled) && ((mainSpawn.spawning === null) || (mainSpawn.spawning === undefined))) {
			let roomCreepRoster = Game.rooms[roomName].memory.creepRoster;
			let roomCreepQuotas = Game.rooms[roomName].memory.creepQuotas;
			if((roomCreepQuotas.dismantler) && (undefToZero(roomCreepRoster.medic) < (roomCreepQuotas.dismantler.length * numMedics))) {
    		    for(let curQuotaIndex in roomCreepQuotas.dismantler) {
    		        let curFlagName = roomCreepQuotas.dismantler[curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === 'medic'));
    		        if(currentFlagCreeps.length < numMedics) {
    		            let medicBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL];
						//let medicBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL];
						//let medicBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL];
						if(Game.flags[curFlagName].memory.medicBodyParts) {
							medicBody = Game.flags[curFlagName].memory.medicBodyParts;
						}
    		            //let newName =
						mainSpawn.createCreep(medicBody, undefined, {spawnRoom: roomName, role: 'medic', flagName: curFlagName});
    			        //console.log('Spawning new medic: ' + newName + ' - ' + curFlagName);
    			        break;
    		        }
    		    }
    		}  else if((roomCreepQuotas.dismantler) && (undefToZero(roomCreepRoster.dismantler) < roomCreepQuotas.dismantler.length)) {
				let curRole = 'dismantler';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						//let curCreepBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK];
    		            //let curCreepBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK];
						let curCreepBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK];
						if(Game.flags[curFlagName].memory.dismantlerBodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.dismantlerBodyParts;
						}
    		            //let newName =
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        //console.log('Spawning new ' + curRole + ': ' + newName + ' - ' + curFlagName);
    			        break;
    		        }
    		    }
    		}
		}



		// for powerBankAttackers
		numMedics = 1;

		if((!mainSpawn.spawnCalled) && ((mainSpawn.spawning === null) || (mainSpawn.spawning === undefined))) {
			let roomCreepRoster = Game.rooms[roomName].memory.creepRoster;
			let roomCreepQuotas = Game.rooms[roomName].memory.creepQuotas;
			if((roomCreepQuotas.powerBankAttacker) && (undefToZero(roomCreepRoster.medic) < (roomCreepQuotas.powerBankAttacker.length * numMedics))) {
    		    for(let curQuotaIndex in roomCreepQuotas.powerBankAttacker) {
    		        let curFlagName = roomCreepQuotas.powerBankAttacker[curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === 'medic'));
    		        if(currentFlagCreeps.length < numMedics) {
    		            // 2 medics, 1 attacker
						//let medicBody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL];
						// 1 medic, 1 attacker
						let medicBody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL];
						if(Game.flags[curFlagName].memory.medicBodyParts) {
							medicBody = Game.flags[curFlagName].memory.medicBodyParts;
						}
    		            //let newName =
						mainSpawn.createCreep(medicBody, undefined, {spawnRoom: roomName, role: 'medic', flagName: curFlagName});
    			        //console.log('Spawning new medic: ' + newName + ' - ' + curFlagName);
    			        break;
    		        }
    		    }
    		}  else if((roomCreepQuotas.powerBankAttacker) && (undefToZero(roomCreepRoster.powerBankAttacker) < roomCreepQuotas.powerBankAttacker.length)) {
				let curRole = 'powerBankAttacker';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
    		            // 2 medics, 1 attacker
						//let curCreepBody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK];
						// 1 medic, 1 atttacker
						let curCreepBody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK];
						if(Game.flags[curFlagName].memory.powerBankAttackerBodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.powerBankAttackerBodyParts;
						}
    		            //let newName =
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        //console.log('Spawning new ' + curRole + ': ' + newName + ' - ' + curFlagName);
    			        break;
    		        }
    		    }
    		}  else if((roomCreepQuotas.powerCollector) && (undefToZero(roomCreepRoster.powerCollector) < roomCreepQuotas.powerCollector.length)) {
				let curRole = 'powerCollector';
    		    for(let curQuotaIndex in roomCreepQuotas[curRole]) {
    		        let curFlagName = roomCreepQuotas[curRole][curQuotaIndex];
    		        let currentFlagCreeps = _.filter(roomCreeps, (creep) => (creep.memory.flagName === curFlagName) && (creep.memory.role === curRole));
    		        if(currentFlagCreeps.length < 1) {
						let curCreepBody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];
						if(Game.flags[curFlagName].memory.bodyParts) {
							curCreepBody = Game.flags[curFlagName].memory.bodyParts;
						}
    		            //let newName =
						mainSpawn.createCreep(curCreepBody, undefined, {spawnRoom: roomName, role: curRole, flagName: curFlagName});
    			        //console.log('Spawning new ' + curRole + ': ' + newName + ' - ' + curFlagName);
    			        break;
    		        }
    		    }
    		}
		}


		// run links
		let links = Game.rooms[roomName].findStructures(STRUCTURE_LINK);
		links.forEach(link => link.run());

		// transfer energy from links to any creeps except carriers, miners, and various special roles
		// find non carriers that aren't full of energy
		//let linkTransferCandidates = _.filter(roomCreeps, (creep) => {
		//		return (creep.memory.role !== 'remoteCarrier') && (creep.memory.role !== 'carrier') && (creep.memory.role !== 'explorer') && (creep.memory.role !== 'reinforcer') && (creep.memory.role !== 'mineralHarvester') && (creep.memory.role !== 'miner') && (creep.memory.role !== 'mineralCarrier') && (creep.memory.role !== 'harvester') && (creep.memory.role !== 'powerCollector') && (creep.carry.energy < creep.carryCapacity);
		//});

		// only refill builders automatically (other roles will withdraw themselves; this is to top up builders)
		let linkTransferCandidates = _.filter(roomCreeps, (creep) => {
				return (creep.memory.role === 'builder') && (creep.carry.energy < creep.carryCapacity);
		});

		links.forEach(link => link.refillCreeps(linkTransferCandidates));


		// calculate mineral distribution network
		if(Game.time % 500 === 0) {
			calcMineralDistribution();
		}

		// run terminals
		if(curRoom.terminal) {
			curRoom.terminal.run();
		}

		// run compound production manager for current room
		if((curRoom.memory.produceCompounds === true) && (Game.time % 10 === 1)) {
		    curRoom.runCompoundProductionManagment();
		}

		// run labs (new flower style)
		curRoom.runLabs();

		// run labs (old style)
		/*
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
		*/

		// run power spawns
		if(curRoom.memory.processPower === true && (Game.time % 5 === 3)) {
			let myRoomStructures = curRoom.find(FIND_MY_STRUCTURES);
			let powerSpawn = getStructure(myRoomStructures, STRUCTURE_POWER_SPAWN);
			if(powerSpawn) {
				if(powerSpawn.power >= 1 && powerSpawn.energy >= 50) {
					powerSpawn.processPower();
				}
			} else {
				console.log('!!!!Error: could not find power spawn in room ' + curRoom.name);
			}
		}

		// run observer
		if(isArrayWithContents(curRoom.memory.observeRooms)) {
			let roomList = curRoom.memory.observeRooms;
			let observers = curRoom.findStructures(STRUCTURE_OBSERVER);
			if(isArrayWithContents(observers)) {
				let observationIndex = Game.time % roomList.length;
				let roomToObserve = roomList[observationIndex];
				if(typeof roomToObserve === 'string') {
					let observeReturn = observers[0].observeRoom(roomToObserve);
					Logger.log(`observing ${roomToObserve} from ${curRoom} (${errorCodeToText(observeReturn)})`, 0);
				}
			}
		}

	}


	// run creep loop
	Memory.roster = {};
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


	// for screeps-visual
	visualizePaths();
	RawVisual.commit();


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
};

function defendRoom(roomName) {

    let hostiles = Game.rooms[roomName].hostiles;

    if(hostiles.length > 0) {
        let username = hostiles[0].owner.username;
		let gameTime = Game.time;
		if(username !== 'Invader') {
        	Game.notify(`User ${username} spotted in room ${roomName} at ${timeLink(roomName, gameTime)}`);
		}
		let towers = Game.rooms[roomName].findStructures(STRUCTURE_TOWER);
        towers.forEach(tower => tower.attack(hostiles[0]));
    } else {
        let repairTargets;

        // check ramparts
        repairTargets = _.filter(Game.rooms[roomName].findStructures(STRUCTURE_RAMPART), (structure) => structure.hits < 50000);

		// check walls
		if(!isArrayWithContents(repairTargets)) {
		    repairTargets = _.filter(Game.rooms[roomName].findStructures(STRUCTURE_WALL), (structure) => structure.hits < 50000);
		}

		// check containers and roads
		if(!isArrayWithContents(repairTargets)) {
		    repairTargets = _.filter(Game.rooms[roomName].findStructures(STRUCTURE_CONTAINER).concat(Game.rooms[roomName].findStructures(STRUCTURE_ROAD)), (structure) => structure.hits < structure.hitsMax * 0.5);
		}

        if(!isArrayWithContents(repairTargets)) {
            // nothing to repair
		    return;
        }

        let topRepairTarget = _.sortBy(repairTargets, (structure) => structure.hits)[0];

	    let towers = _.filter(Game.rooms[roomName].findStructures(STRUCTURE_TOWER), (structure) => structure.energy > TOWER_RESERVE_ENERGY);

	    if(isArrayWithContents(towers)) {
	        towers.forEach((tower) => tower.repair(topRepairTarget));
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
global.countAllC = countAllCreepFlags;
global.cacf = countAllCreepFlags;

function cleanOldFlagsFromMemory() {
	for(let name in Memory.flags) {
		if(!Game.flags[name]) {
			delete Memory.flags[name];
		}
	}
	return OK;
}
global.cleanOldFlagsFromMemory = cleanOldFlagsFromMemory;

function minePowerRoom(targetRoom, sourceRooms) {
	if(typeof targetRoom !== 'string') {
		return ERR_INVALID_ARGS;
	}

	if(!isArrayWithContents(sourceRooms)) {
		return ERR_INVALID_ARGS;
	}

	let flagSpot = new RoomPosition(25, 25, targetRoom);

	for(let i in sourceRooms) {
		let sourceRoom = sourceRooms[i];
		if(typeof sourceRoom === 'string') {
			let flagName = flagSpot.createFlag(sourceRoom + '_remote_' + targetRoom + '_creep_powerBankAttacker_0', COLOR_RED, COLOR_RED);
			if(typeof flagName !== 'string') {
				return flagName;
			}
		}
	}

	return OK;
}
global.minePowerRoom = minePowerRoom;

function calcMineralDistribution() {
	let roomList = [];

	// get list of rooms available for mineral distribution
	for(let i in Game.rooms) {
		let curRoom = Game.rooms[i];

		if(!curRoom.isMine() || !curRoom.storage || !curRoom.terminal) {
			continue;
		}

		let mineral = curRoom.find(FIND_MINERALS)[0];
		if(!mineral) {
			continue;
		}

		let retStructs = curRoom.lookForAt(LOOK_STRUCTURES, mineral.pos);
		let extractor = getStructure(retStructs, STRUCTURE_EXTRACTOR);
		if(!extractor) {
			continue;
		}

		// could also check for presence in storage as well to determine room availability
		// mineral distribution network would reorient if a room ran out of a mineral
		// but this could get expensive if too many rooms are transferring across the whole empire

		// reset current distribution settings
		// new method
		delete curRoom.memory.mineralDistribution;
		// old method
		curRoom.memory.distributionList = [];

		roomList.push({ room: curRoom, mineral: mineral});
	}

	// record the rooms available for each mineral type
	Memory.roomMinerals = {};
	for(let i in roomList) {
		let curRoom = roomList[i].room;
		let mineral = roomList[i].mineral;

		Memory.roomMinerals[mineral.mineralType] = Memory.roomMinerals[mineral.mineralType] || [];
		Memory.roomMinerals[mineral.mineralType].push(curRoom.name);
	}
	let roomMinerals = Memory.roomMinerals;

	// get the distance between available rooms
	let roomDistances = {};
	for(let i in roomList) {
		let roomName1 = roomList[i].room.name;

		roomDistances[roomName1] = roomDistances[roomName1] || {};

		for(let j in roomList) {
			let roomName2 = roomList[j].room.name;

			roomDistances[roomName1][roomName2] = Game.map.getRoomLinearDistance(roomName1, roomName2, true);
		}
	}

	for(let i in roomList) {
		let curRoom = roomList[i].room;

		for(let curMineral in roomMinerals) {
			if(curMineral === roomList[i].mineral.mineralType) {
				continue;
			}

			let shortestDist = Number.MAX_SAFE_INTEGER;
			let closestRoom;

			for(let j in roomMinerals[curMineral]) {
				let mineralRoomName = roomMinerals[curMineral][j];
				let roomDistance = roomDistances[curRoom.name][mineralRoomName];

				if(roomDistance > 15) {
				    continue;
				}

				if( !Game.rooms[mineralRoomName].storage.store[curMineral] &&
				    (!Game.rooms[mineralRoomName].terminal.store[curMineral] ||
				    Game.rooms[mineralRoomName].terminal.store[curMineral] < Game.rooms[mineralRoomName].terminal.getResourceQuota(curMineral)) &&
				    !Game.rooms[mineralRoomName].memory.shouldMine) {
				    continue;
				}

				if(roomDistance < shortestDist) {
					shortestDist = roomDistance;
					closestRoom = mineralRoomName;
				}
			}

			if(typeof closestRoom !== 'undefined') {
				// new method
				Memory.rooms[closestRoom].mineralDistribution = Memory.rooms[closestRoom].mineralDistribution || {};
				Memory.rooms[closestRoom].mineralDistribution.mineral = Memory.rooms[closestRoom].mineralDistribution.mineral || curMineral;
				Memory.rooms[closestRoom].mineralDistribution.list = Memory.rooms[closestRoom].mineralDistribution.list || [];
				Memory.rooms[closestRoom].mineralDistribution.list.push(curRoom.name);

				// old method
				Memory.rooms[closestRoom].distributionList.push({ room: curRoom.name, mineral: curMineral});
			}
		}
	}

	return OK;
}
global.calcMineralDistribution = calcMineralDistribution;

function drawFlagPath(arg1, arg2) {
	const ROAD_COST = 3;
    const PLAIN_COST = 4;
    const SWAMP_COST = 5;

    let position1;
    if(arg1 instanceof RoomPosition) {
        position1 = arg1;
    } else if(typeof arg1.pos !== 'undefined' && arg1.pos instanceof RoomPosition) {
        position1 = arg1.pos;
    } else {
        Logger.errorLog(`invalid parameter to drawFlagPath function: ${arg1} of type ${typeof arg1}`);
    }

    let position2;
    if(arg2 instanceof RoomPosition) {
        position2 = arg2;
    } else if(typeof arg2.pos !== 'undefined' && arg2.pos instanceof RoomPosition) {
        position2 = arg2.pos;
    } else {
        Logger.errorLog(`invalid parameter to drawFlagPath function: ${arg2} of type ${typeof arg2}`, ERR_INVALID_ARGS, 4);
    }

    let flagPath = PathFinder.search(position1, position2, {
        plainCost: PLAIN_COST,
        swampCost: SWAMP_COST,
		maxOps: 8000,
        roomCallback: function(roomName) {
            let room = Game.rooms[roomName];
            if(!room) {
				return;
			}
            let costs = new PathFinder.CostMatrix();

            room.find(FIND_STRUCTURES).forEach(function(structure) {
                if(structure.structureType === STRUCTURE_ROAD) {
                    costs.set(structure.pos.x, structure.pos.y, ROAD_COST);
                } else if(structure.structureType !== STRUCTURE_CONTAINER && (structure.structureType !== STRUCTURE_RAMPART || !structure.my)) {
                    // Can't walk through non-walkable buildings
                    costs.set(structure.pos.x, structure.pos.y, 0xff);
                }
            });

            /*
            room.find(FIND_CREEPS).forEach(function(creep) {
                costs.set(creep.pos.x, creep.pos.y, 0xff);
            });
            */

            return costs;
        },
    });

    if(!flagPath) {
        Logger.errorLog('could not find path for drawFlagPath', ERR_NO_PATH, 4);
        return;
    }

    for(let i in flagPath.path) {
        let position = flagPath.path[i];
        position.createFlag(`flagPath_${i}`);
    }

    return OK;
}
global.drawFlagPath = drawFlagPath;

function removeFlagPath() {
    for(let i in Game.flags) {
        let flag = Game.flags[i];
        if(/flagPath_/.test(flag) === true) {
            console.log(flag.name);
            flag.remove();
        }
    }
    return OK;
}
global.removeFlagPath = removeFlagPath;

function marketSell(room_name, resource, amt = Infinity) {
    // 9-30-2016 patch makes this way faster I guess?
    let orders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: resource});
    orders = _.filter(orders, o => o.price > 0.1);
    if(!isArrayWithContents(orders)) {
        Logger.highlight('no valid orders found');
        return;
    }
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

// visualize creep paths with screeps-visual
function visualizePaths(){
	let Visual = require('visual');
	let colors = [];
	let COLOR_BLACK = colors.push('#000000') - 1;
	let COLOR_PATH = colors.push('rgba(255,255,255,0.5)') - 1;
	_.each(Game.rooms,(room,name)=>{
		let visual = new Visual(name);
		visual.defineColors(colors);
		visual.setLineWidth = 0.5;
		_.each(Game.creeps,creep=>{
			if(creep.room != room) return;
			let mem = creep.memory;
			if(mem._move){
				let path = Room.deserializePath(mem._move.path);
				if(path.length){
					visual.drawLine(path.map(p=>([p.x,p.y])),COLOR_PATH,{ lineWidth: 0.1 });
				}
			}
		});
		visual.commit();
	});
}

// call this function to use screeps-visual through steam
global.loadVisual = function(){
  return console.log('<script>' +
    'if(!window.visualLoaded){' +
    '  $.getScript("https://screepers.github.io/screeps-visual/src/visual.screeps.user.js");' +
    '  window.visualLoaded = true;' +
    '}</script>');
};

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

/**
 * main tick loop
 */
module.exports.loop = function() {
	// wrap main function if profiler has been turned on
	if(Memory.config && Memory.config.enableProfiler === true) {
		profiler.wrap(function() {
			main();
		});
	} else {
		main();
	}
};
