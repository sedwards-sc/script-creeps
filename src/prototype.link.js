/* jshint esversion: 6 */
/*
 * prototype.link
 */

StructureLink.prototype.run = function() {
    if(this.energy >= (this.energyCapacity * 0.95)) {
        let storageLink = Game.getObjectById(this.room.memory.storageLinkId);
        if(storageLink === null) {
            if(this.room.storage === undefined) {
                return;
            }
            let roomLinks = this.room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_LINK } });
            let closeLinks = this.room.storage.pos.findInRange(roomLinks, 3);
            if(closeLinks.length > 0) {
                storageLink = closeLinks[0];
                this.room.memory.storageLinkId = storageLink.id;
            } else {
                return;
            }
        }

        if(this.id === storageLink.id) {
            return;
        }

        let refillers = _.filter(Game.creeps, (creep) => {
				return ((creep.memory.role === 'remoteCarrier') || (creep.memory.role === 'carrier') || (creep.memory.role === 'explorer')) && (creep.carry.energy > 0);
		});

		// using 7 range for better behaviour in secondary room - was originally using 3
		let inRangeRefillers = this.pos.findInRange(refillers, 7);

		if(inRangeRefillers.length > 0) {
		    let transferReturn = this.transferEnergyFirstTimeOnly(storageLink);
			if(transferReturn === OK) {
				console.log('remote link energy transferred to storage link - room: ' + this.room.name + ', link: ' + this.id);
				this.room.memory.transferToStorageCounts = this.room.memory.transferToStorageCounts || {};
				this.room.memory.transferToStorageCounts[this.id] = this.room.memory.transferToStorageCounts[this.id] || {};
				this.room.memory.transferToStorageCounts[this.id].success = this.room.memory.transferToStorageCounts[this.id].success || 0;
				this.room.memory.transferToStorageCounts[this.id].success++;
			} else if(transferReturn === ERR_TIRED) {
				console.log('too tired to transfer remote link energy to storage link - room: ' + this.room.name + ', link: ' + this.id);
				this.room.memory.transferToStorageCounts = this.room.memory.transferToStorageCounts || {};
				this.room.memory.transferToStorageCounts[this.id] = this.room.memory.transferToStorageCounts[this.id] || {};
				this.room.memory.transferToStorageCounts[this.id].fail = this.room.memory.transferToStorageCounts[this.id].fail || 0;
				this.room.memory.transferToStorageCounts[this.id].fail++;
			}
		}
    }
};

StructureLink.prototype.transferEnergyFirstTimeOnly = function(transferTarget) {
    var transferReturnVal = ERR_BUSY;

    if(!this.transferred) {
        transferReturnVal = this.transferEnergy(transferTarget);
        if(transferReturnVal === OK) {
           this.transferred = 1;
        }
    } else {
        console.log('-link already transferred this tick - ' + this.id);
    }

    return transferReturnVal;
};


//StructureLink.prototype.testVar = 0;

StructureLink.prototype.testFunc = function() {

    //this.testVar++;

    if(this.testVariable) {
        //console.log('---testing - testVariable true - ' + this.id);
    } else {
        this.testVariable = 1;
        console.log('---testing - testVariable false - ' + this.id);
    }

};
