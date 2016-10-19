/* jshint esversion: 6 */
/*
 * prototype.terminal
 */

StructureTerminal.prototype.getResourceQuota = function(resourceType) {
	if(resourceType === RESOURCE_ENERGY) {
		return 50000;
	}
	return 6000;
};

StructureTerminal.prototype.run = function() {
	let successfulTransfer = false;

	if(typeof this.room.memory.distributionList !== 'undefined') {
		for(let i in this.room.memory.distributionList) {
			let curDistObj = this.room.memory.distributionList[i];

			if(undefToZero(this.store[curDistObj.mineral]) < this.getResourceQuota(curDistObj.mineral)) {
				continue;
			}

			let destinationTerminal = Game.rooms[curDistObj.room].terminal;

			if(undefToZero(destinationTerminal.store[curDistObj.mineral]) < destinationTerminal.getResourceQuota(curDistObj.mineral)) {
				let resourceDeficit = destinationTerminal.getResourceQuota(curDistObj.mineral) - undefToZero(destinationTerminal.store[curDistObj.mineral]);
				let transferAmount = Math.min(resourceDeficit, 1000);
				if(this.send(curDistObj.mineral, transferAmount, curDistObj.room, 'empire distribution') === OK) {
				    //console.log('normal, ' + curDistObj.room);
					successfulTransfer = true;
					break;
				}
			}

			if(curDistObj.override === true) {
				// protect against draining a room or overfilling the other room
				if((this.room.storage.store.energy > 500000) && (undefToZero(destinationTerminal.store[curDistObj.mineral]) < (destinationTerminal.getResourceQuota(curDistObj.mineral) * 2))) {
					if(this.send(curDistObj.mineral, 1000, curDistObj.room, 'empire distribution (override)') === OK) {
					    //console.log('normal, ' + curDistObj.room);
						successfulTransfer = true;
						break;
					}
				}
			}
		}
	}
	return;
	if(!successfulTransfer) {
		let roomNameNeedingEnergy = this.getRoomNeedsEnergyMost();
		let roomNeedingEnergy;

		if(roomNameNeedingEnergy) {
			roomNeedingEnergy = Game.rooms[roomNameNeedingEnergy];
		} else {
			return;
		}

		if((this.room.storage.store.energy > 500000) && (undefToZero(roomNeedingEnergy.terminal.store.energy) < (roomNeedingEnergy.terminal.getResourceQuota(RESOURCE_ENERGY) * 2))) {
			if(this.send(RESOURCE_ENERGY, 5000, roomNameNeedingEnergy, 'empire distribution (room requires energy most)') === OK) {
				console.log('room ' + this.room.name + ' sending energy to room ' + roomNameNeedingEnergy);
			}
		}
	}
};

// will return room with lowest energy in storage (must have terminal)
StructureTerminal.prototype.getRoomNeedsEnergyMost = function () {
	let roomInNeed;
	let roomStorageEnergy = STORAGE_CAPACITY;

	for(let curRoomName in Game.rooms) {
		let curRoom = Game.rooms[curRoomName];

		if(curRoom.storage && curRoom.terminal && (curRoom.storage.store.energy < roomStorageEnergy) && (curRoom.terminal.store.energy < 100000)) {
			roomInNeed = curRoomName;
		}
	}

	return roomInNeed;
};
