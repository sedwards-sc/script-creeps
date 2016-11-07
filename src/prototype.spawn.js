/* jshint esversion: 6, loopfunc: true */
/*
 * prototype.spawn
 */

StructureSpawn.prototype.spawnHarvester = function(roomCreeps) {
	let harvesterBody = [WORK,CARRY,MOVE,MOVE];

	let myRoomEnergyCapacity = Game.rooms[this.pos.roomName].energyCapacityAvailable;

	if(roomCreeps && roomCreeps.length > 0) {
		if(myRoomEnergyCapacity >= 1150) {
			harvesterBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
		} else if(myRoomEnergyCapacity >= 950) {
			harvesterBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
		} else if (myRoomEnergyCapacity >= 350) {
			harvesterBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
		}
	}

	let harvesters0 = _.filter(roomCreeps, (creep) => creep.memory.hMine === 0);
	let harvesters1 = _.filter(roomCreeps, (creep) => creep.memory.hMine === 1);

	if(harvesters1.length < 3) {
		let newName = this.createCreep(harvesterBody, undefined, {role: 'harvester', hMine: 1, spawnRoom: this.pos.roomName});
		console.log('Spawning new harvester1 (' + this.pos.roomName + '): ' + newName);
	} else if(harvesters0.length < 3) {
		let newName = this.createCreep(harvesterBody, undefined, {role: 'harvester', hMine: 0, spawnRoom: this.pos.roomName});
		console.log('Spawning new harvester0 (' + this.pos.roomName + '): ' + newName);
	}
};

StructureSpawn.prototype.spawnHarvester2 = function(roomCreeps) {
	let harvesterBody = [WORK,CARRY,MOVE,MOVE];

	let myRoomEnergyCapacity = Game.rooms[this.pos.roomName].energyCapacityAvailable;

	let roomCreepRoster = this.room.memory.creepRoster;

	if(undefToZero(roomCreepRoster.harvester) > 0) {
		if(myRoomEnergyCapacity >= 1150) {
			harvesterBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
		} else if(myRoomEnergyCapacity >= 950) {
			harvesterBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
		} else if (myRoomEnergyCapacity >= 400) {
			harvesterBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
		}
	}

	let roomCreepQuotas = this.room.memory.creepQuotas;

	for(let curHarvesterIndex in roomCreepQuotas.harvester) {
		let curHarvesterFlagName = roomCreepQuotas.harvester[curHarvesterIndex];
		let currentFlagHarvesters = _.filter(roomCreeps, (creep) => creep.memory.flagName === curHarvesterFlagName);
		if((currentFlagHarvesters.length < 1) || (currentFlagHarvesters[0].ticksToLive <= 12)) {
			let newName = this.createCreep(harvesterBody, undefined, {spawnRoom: this.pos.roomName, role: 'harvester', flagName: curHarvesterFlagName});
			console.log('Spawning new harvester: ' + newName + ' - ' + curHarvesterFlagName);
			break;
		}
	}
};

StructureSpawn.prototype.spawnMineralHarvester = function() {
	let harvesterBody = [WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
	//let harvesterBody = [WORK,CARRY,MOVE,MOVE];

	let newName = this.createCreep(harvesterBody, undefined, {role: 'mineralHarvester', spawnRoom: this.pos.roomName});
	console.log('Spawning new mineral harvester (' + this.pos.roomName + '): ' + newName);
};

StructureSpawn.prototype.updateSpawnFlag = function() {
	let flagsAtCurPos = this.room.lookForAt(LOOK_FLAGS, this.pos);

	this.log(JSON.stringify(flagsAtCurPos));

	let spawningFlagRegex = new RegExp('^' + this.name + '_spawningRole_');
	let spawningFlags = _.filter(flagsAtCurPos, (flag) => spawningFlagRegex.test(flag.name) === true);

	if(spawningFlags.length > 0) {
		let foundFlag = false;

		for(let i in spawningFlags) {
			let spawningFlag = spawningFlags[i];

			let flagSpawningRoleReturn = /_spawningRole_(.+)/.exec(spawningFlag.name);

			if(flagSpawningRoleReturn === null) {
				console.log('!!!!ERROR: spawningRole flag with no role: ' + spawningFlag);
				continue;
			}

			let flagSpawningRole = flagSpawningRoleReturn[1];

			if((this.spawning !== null) && (this.spawning !== undefined) && (Memory.creeps[this.spawning.name].role === flagSpawningRole)) {
				foundFlag = true;
				continue;
			} else {
				Game.flags[spawningFlag].remove();
			}
		}

		if(foundFlag === true) {
			return;
		}
	}

	// else create flag for the currently spawning role
	let flagName = this.name + '_spawningRole_' + Memory.creeps[this.spawning.name].role;
	let flagCreateReturn = this.pos.createFlag(flagName, COLOR_CYAN, COLOR_WHITE);

	this.errorLog('problem creating spawningRole flag: ' + flagName, flagCreateReturn);

	if(flagCreateReturn === ERR_NAME_EXISTS) {
		Game.flags[flagName].remove();
	}
};

function undefToZero(x) {
	return x || 0;
}
