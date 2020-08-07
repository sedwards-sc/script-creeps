/* jshint esversion: 6 */

class ClaimerQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('claimer', PRIORITY_TRIVIAL, id, flag, colony);
	}

	initQuest() {
		this.claimers = [];
	}

	runCensus() {
		let claimerBody = [MOVE, CLAIM];
		let maxClaimers = 1;
		this.jobDone = this.memory.claimed && this.memory.signed;
		if(this.jobDone) {
			maxClaimers = 0;
		}
		this.claimers = this.attendance(this.nameId, claimerBody, maxClaimers, {blindSpawn: true});
	}

	runActivities() {
		for(let creep of this.claimers) {
			if(!creep.spawning) {
				this.claimerActions(creep)
			}
		}
	}

	questEnd() {
	}

	claimerActions(creep) {
		if(creep.fleeHostiles()) {
			creep.memory.avoidMe = false;
			return;
		}

		if(creep.pos.isEqualTo(this.flag)) {
			creep.memory.avoidMe = true;

			if(this.jobDone) {
				creep.say('vision');
				return;
			}

			if(creep.room.controller && creep.room.controller.owner && creep.room.controller.owner.username !== USERNAME) {
				creep.attackController(creep.room.controller);
				return;
			}
			if(creep.room.controller && creep.room.controller.owner && creep.room.controller.owner.username === USERNAME) {
				this.memory.claimed = true;
				let signReturn = creep.signController(creep.room.controller, 'Marked territory');
				if(signReturn === OK) {
					this.memory.signed = true;
				} else {
					creep.errorLog('could not successfully sign controller', signReturn, 4);
				}
				return;
			}

			let claimReturn = creep.claimController(creep.room.controller);
			if(claimReturn !== OK) {
				creep.errorLog('could not successfully claim controller', claimReturn, 4);
			}
		} else {
			creep.travelTo(this.flag, { 'useFindRoute': true });
		}
	}
}

global.ClaimerQuest = ClaimerQuest;
