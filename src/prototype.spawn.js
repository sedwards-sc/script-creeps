/* jshint esversion: 6 */
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

	if(harvesters0.length < 3) {
		let newName = this.createCreep(harvesterBody, undefined, {role: 'harvester', hMine: 0, spawnRoom: this.pos.roomName});
		console.log('Spawning new harvester0 (' + this.pos.roomName + '): ' + newName);
	} else if(harvesters1.length < 3) {
		let newName = this.createCreep(harvesterBody, undefined, {role: 'harvester', hMine: 1, spawnRoom: this.pos.roomName});
		console.log('Spawning new harvester1 (' + this.pos.roomName + '): ' + newName);
	}
};

StructureSpawn.prototype.spawnMineralHarvester = function() {
	let harvesterBody = [WORK,CARRY,MOVE,MOVE];

	let newName = this.createCreep(harvesterBody, undefined, {role: 'mineralHarvester', spawnRoom: this.pos.roomName});
	console.log('Spawning new mineral harvester (' + this.pos.roomName + '): ' + newName);
};
