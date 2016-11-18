/* jshint esversion: 6 */
/*
 * prototype.terminal
 */

StructureTerminal.prototype.getResourceQuota = function(resourceType) {
    //if((resourceType === RESOURCE_UTRIUM) && (this.room.name === 'E7S24')) {
    //    return 30000;
    //}

	if(resourceType === RESOURCE_ENERGY) {
		return 50000;
	}

	if(resourceType === RESOURCE_HYDROGEN ||
	    resourceType === RESOURCE_OXYGEN ||
	    resourceType === RESOURCE_UTRIUM ||
	    resourceType === RESOURCE_LEMERGIUM ||
	    resourceType === RESOURCE_KEANIUM ||
	    resourceType === RESOURCE_ZYNTHIUM) {

	    return 6000;
	}

	if(resourceType === RESOURCE_CATALYST) {
	    return 6000;
	}

	if(resourceType === RESOURCE_GHODIUM) {
	    return 6000;
	}

	if(resourceType === RESOURCE_HYDROXIDE) {
	    return 9000;
	}

	if(resourceType === RESOURCE_ZYNTHIUM_KEANITE || resourceType === RESOURCE_UTRIUM_LEMERGITE) {
	    return 6000;
	}

	if(resourceType === RESOURCE_UTRIUM_HYDRIDE ||
	    resourceType === RESOURCE_UTRIUM_OXIDE ||
	    resourceType === RESOURCE_KEANIUM_HYDRIDE ||
	    resourceType === RESOURCE_KEANIUM_OXIDE ||
	    resourceType === RESOURCE_LEMERGIUM_HYDRIDE ||
	    resourceType === RESOURCE_LEMERGIUM_OXIDE ||
	    resourceType === RESOURCE_ZYNTHIUM_HYDRIDE ||
	    resourceType === RESOURCE_ZYNTHIUM_OXIDE ||
	    resourceType === RESOURCE_GHODIUM_HYDRIDE ||
	    resourceType === RESOURCE_GHODIUM_OXIDE) {

        return 3000;
	}

	if(resourceType === RESOURCE_UTRIUM_ACID ||
	    resourceType === RESOURCE_UTRIUM_ALKALIDE ||
	    resourceType === RESOURCE_KEANIUM_ACID ||
	    resourceType === RESOURCE_KEANIUM_ALKALIDE ||
	    resourceType === RESOURCE_LEMERGIUM_ACID ||
	    resourceType === RESOURCE_LEMERGIUM_ALKALIDE ||
	    resourceType === RESOURCE_ZYNTHIUM_ACID ||
	    resourceType === RESOURCE_ZYNTHIUM_ALKALIDE ||
	    resourceType === RESOURCE_GHODIUM_ACID ||
	    resourceType === RESOURCE_GHODIUM_ALKALIDE) {

        return 3000;
    }

    if(resourceType === RESOURCE_CATALYZED_UTRIUM_ACID ||
	    resourceType === RESOURCE_CATALYZED_UTRIUM_ALKALIDE ||
	    resourceType === RESOURCE_CATALYZED_KEANIUM_ACID ||
	    resourceType === RESOURCE_CATALYZED_KEANIUM_ALKALIDE ||
	    resourceType === RESOURCE_CATALYZED_LEMERGIUM_ACID ||
	    resourceType === RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE ||
	    resourceType === RESOURCE_CATALYZED_ZYNTHIUM_ACID ||
	    resourceType === RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE ||
	    resourceType === RESOURCE_CATALYZED_GHODIUM_ACID ||
	    resourceType === RESOURCE_CATALYZED_GHODIUM_ALKALIDE) {

        return 3000;
    }

	return 3000;
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

	if( (!successfulTransfer) &&
		(undefToZero(this.store[RESOURCE_ENERGY]) >= this.getResourceQuota(RESOURCE_ENERGY)) &&
		(undefToZero(this.room.storage.store.energy) > 550000) ) {

		let roomNameNeedingEnergy = this.getRoomNeedsEnergyMost();
		let roomNeedingEnergy;

		if(roomNameNeedingEnergy) {
			if(roomNameNeedingEnergy === this.room.name) {
				return;
			} else {
				roomNeedingEnergy = Game.rooms[roomNameNeedingEnergy];
			}
		} else {
			return;
		}

		if((undefToZero(roomNeedingEnergy.terminal.store.energy) < 75000) && (roomNeedingEnergy.storage.store.energy < 600000)) {
			if(this.send(RESOURCE_ENERGY, 5000, roomNameNeedingEnergy, 'empire distribution (room requires energy most)') === OK) {
				this.log('sending energy to room ' + roomNameNeedingEnergy);
			}
		}
	}
};

// will return name of room with lowest energy in storage (must have terminal)
StructureTerminal.prototype.getRoomNeedsEnergyMost = function () {
	let roomInNeed;
	let roomEnergy = STORAGE_CAPACITY + TERMINAL_CAPACITY;

	for(let curRoomName in Game.rooms) {
		let curRoom = Game.rooms[curRoomName];

		if(curRoom.storage && curRoom.terminal) {
			let curRoomEnergy = curRoom.storage.store.energy + curRoom.terminal.store.energy;

			if(curRoomEnergy < roomEnergy) {
				roomInNeed = curRoomName;
				roomEnergy = curRoomEnergy;
			}
		}
	}

	return roomInNeed;
};
