/*
 * prototype.creep
 */

Creep.prototype.runMineralHarvester = function() {
	// state 0 is harvest
	// state 1 is transfer minerals
	if(creep.memory.state === undefined) {
		creep.memory.state = 0;
	}

	if(creep.carry.energy == creep.carryCapacity) {
		if(creep.memory.state === 0) {
			creep.say('I\'m full!');
		}
		creep.memory.state = 1;
	}

	if (creep.carry.energy === 0) {
		if(creep.memory.state == 1) {
			creep.say('I\'m empty!');
		}
		creep.memory.state = 0;
	}

	if(creep.memory.state === 0) {
		// harvest
		// TODO: find closest source
		//var source = creep.pos.findClosestByPath
		//var sources = creep.room.find(FIND_SOURCES);
		//if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
		//    creep.moveTo(sources[0]);
		//}

		// harvest
		var myMineral;
		if(creep.memory.mineralId === undefined) {
			myMineral = this.room.find(FIND_MINERALS)[0];
			this.memory.mineralId = myMineral.id;
		} else {
			myMineral = Game.getObjectById(this.memory.mineralId);
			if(myMineral === null) {
				delete this.memory.mineralId;
			}
		}
		if(creep.harvest(myMineral) === ERR_NOT_IN_RANGE) {
			creep.moveTo(myMineral);
		}
	} else {
		// transfer minerals to storage
		var roomStorage = this.room.storage;
		if(roomStorage) {
			if(this.transfer(roomStorage, RESOURCE_OXYGEN) === ERR_NOT_IN_RANGE) {
				this.moveTo(roomStorage);
			}
		}
	}
};
