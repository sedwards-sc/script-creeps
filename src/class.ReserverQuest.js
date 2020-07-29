/* jshint esversion: 6 */

class ReserverQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('reserver', PRIORITY_LOW, id, flag, colony);
	}

	initQuest() {
		this.reservers = [];
	}

	runCensus() {
		let reserverBody = [MOVE, MOVE, CLAIM, CLAIM];
		let maxReservers = 1;
		if(this.spawnGroup.maxSpawnEnergy < calculateCreepCost(reserverBody)) {
			this.errorLog("insufficient energy capacity to spawn reserver", ERR_NOT_ENOUGH_RESOURCES)
			maxReservers = 0;
		}
		this.reservers = this.attendance(this.nameId, reserverBody, maxReservers);
	}

	runActivities() {
		for(let creep of this.reservers) {
			if(!creep.spawning) {
				this.reserverActions(creep)
			}
		}
	}

	questEnd() {
	}

	invalidateQuestCache() {
	}

	reserverActions(creep) {
		if(creep.fleeHostiles()) {
			return;
		}

		if(creep.pos.isEqualTo(this.flag)) {
			let reserveReturn = creep.reserveController(creep.room.controller);
	        if(reserveReturn !== OK) {
				creep.errorLog('could not successfully reserve controller', reserveReturn, 4);
	        }
		} else {
			creep.moveTo(this.flag);
		}
	}
}

global.ReserverQuest = ReserverQuest;
