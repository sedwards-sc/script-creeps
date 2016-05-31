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
	
	var newName = this.createCreep(harvesterBody, undefined, {role: 'harvester', spawnRoom: this.pos.roomName});
	console.log('Spawning new harvester (' + this.pos.roomName + '): ' + newName);
};

