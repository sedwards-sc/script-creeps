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
	if(typeof this.room.memory.distributionList === 'undefined') {
		return;
	}

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
				break;
			}
		}

		if(curDistObj.override === true) {
			// protect against draining a room or overfilling the other room
			if((this.room.storage.store.energy > 500000) && (undefToZero(destinationTerminal.store[curDistObj.mineral]) < (destinationTerminal.getResourceQuota(curDistObj.mineral) * 2)) {
				if(this.send(curDistObj.mineral, 1000, curDistObj.room, 'empire distribution (override)') === OK) {
					break;
				}
			}
		}
	}
};
