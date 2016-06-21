/* jshint esversion: 6 */
/*
 * prototype.spawn
 */

StructureSpawn.prototype.spawnHarvester = function(roomCreeps) {
	var harvesterBody = [WORK,CARRY,MOVE,MOVE];

	var myRoomEnergyCapacity = Game.rooms[this.pos.roomName].energyCapacityAvailable;

	if(roomCreeps && roomCreeps.length > 0) {
		if(myRoomEnergyCapacity >= 950) {
			harvesterBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
		} else if (myRoomEnergyCapacity >= 350) {
			harvesterBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
		}
	}

	var harvesters0 = _.filter(roomCreeps, (creep) => creep.memory.hMine === 0);
	var harvesters1 = _.filter(roomCreeps, (creep) => creep.memory.hMine === 1);

	if(harvesters0.length < 2) {
		var newName = this.createCreep(harvesterBody, undefined, {role: 'harvester', hMine: 0, spawnRoom: this.pos.roomName});
		console.log('Spawning new harvester0 (' + this.pos.roomName + '): ' + newName);
	} else if(harvesters1.length < 2) {
		var newName = this.createCreep(harvesterBody, undefined, {role: 'harvester', hMine: 1, spawnRoom: this.pos.roomName});
		console.log('Spawning new harvester1 (' + this.pos.roomName + '): ' + newName);
	}
};
