/* jshint esversion: 6 */

class DropMinerQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		// TODO: adjust priority vs harvesters
		super('dropMiner', PRIORITY_MEDIUM, id, flag, colony);
	}

	initQuest() {
		this.miners = [];
	}

	runCensus() {
		// TODO: cache path length to flag and add to prespawn
		// TODO: remove blindSpawn after introducing "sentinal" or something for guarding remote rooms (reservers might be enough...)
		this.miners = this.attendance(this.nameId, this.spawnGroup.workerBodyRatio(1, 0, 1, 1, 5).reverse(), 1, {prespawn: 0, blindSpawn: true});
	}

	runActivities() {
		for(let creep of this.miners) {
			if(!creep.spawning) {
				this.minerActions(creep)
			}
		}
	}

	questEnd() {
	}

	invalidateQuestCache() {
	}

	minerActions(creep) {
		if((Game.time % 50) === 1) {
			let reqParts = _.filter(creep.body, function(bodyPart) { return (bodyPart.type === WORK) && (bodyPart.hits > 0); });

			if(typeof reqParts === 'undefined' || reqParts.length === 0) {
				creep.errorLog('missing required body parts; attempting suicide', ERR_NO_BODYPART, 4);
				creep.suicide();
			}
		}

	    if(creep.pos.isEqualTo(this.flag)) {
	        let mySource = Game.getObjectById(creep.memory.mySourceId);
	        if(mySource === null) {
	            mySource = this.flag.pos.findClosestByRange(FIND_SOURCES);
	            creep.memory.mySourceId = mySource.id;
	        }

	        let harvestReturn = creep.harvest(mySource);
	        if(harvestReturn != OK) {
	            creep.errorLog('could not successfully harvest', harvestReturn, 4);
	        }
	    } else {
	        creep.moveTo(this.flag);
	    }
	}
}

global.DropMinerQuest = DropMinerQuest;
