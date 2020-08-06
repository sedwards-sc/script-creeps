/* jshint esversion: 6 */

class SentinelQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('sentinel', PRIORITY_MEDIUM - 1, id, flag, colony);
	}

	initQuest() {
		this.sentinels = [];
	}

	runCensus() {
		let options = {};
		options.prespawn = 0;
		this.sentinels = this.attendance(this.nameId, this.spawnGroup.bodyRatio({move: 4, attack: 3, heal: 1}, 1), 1, options);
	}

	runActivities() {
		for(let creep of this.sentinels) {
			if(!creep.spawning) {
				this.sentinelActions(creep)
			}
		}
	}

	questEnd() {
	}

	sentinelActions(creep) {
	}
}

global.SentinelQuest = SentinelQuest;
