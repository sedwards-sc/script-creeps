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
	if(typeof this.memory.distributionList === 'undefined') {
		return;
	}

	for(let i in this.memory.distributionList) {
		let curDistObj = this.memory.distributionList[i];

		if(this.store[curDistObj.mineral] < this.getResourceQuota(curDistObj.mineral)) {
			continue;
		}

		let destinationTerminal = Game.rooms[curDistObj.room].terminal;

		if(destinationTerminal.store[curDistObj.mineral] < destinationTerminal.getResourceQuota(curDistObj.mineral)) {
			let resourceDeficit = destinationTerminal.getResourceQuota(curDistObj.mineral) - destinationTerminal.store[curDistObj.mineral];
			let transferAmount = Math.min(resourceDeficit, 1000);
			if(this.send(curDistObj.mineral, transferAmount, curDistObj.room, 'empire distribution') === OK) {
				break;
			}
		}
	}
};
