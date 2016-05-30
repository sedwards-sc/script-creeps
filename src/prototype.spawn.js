/*
 * prototype.spawn
 */

StructureSpawn.prototype.spawnHarvester = function(roomCreeps) {
	var harvesterBody = [WORK,CARRY,MOVE,MOVE];
	
	var myRoomEnergy = Game.rooms[this.pos.roomName].energyAvailable;
	
	if(roomCreeps && roomCreeps.length > 0) {
		if(myRoomEnergy >= 950) {
			harvesterBody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
		} else if (myRoomEnergy >= 350) {
			harvesterBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE];
		}
	}
	
	var newName = this.createCreep(harvesterBody, undefined, {role: 'harvester', spawnRoom: this.pos.roomName});
	console.log('-test Spawning new harvester: ' + newName);
	console.log('--' + myRoomEnergy + ' ' + JSON.stringify(roomCreeps));
};

