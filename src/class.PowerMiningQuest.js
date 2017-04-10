/* jshint esversion: 6 */

class PowerMiningQuest {

	/**
	 *
	 */
	constructor(epic) {
		super(powerMining, epic);
	}

    initQuest() {
		let observer = this.room.findStructures(STRUCTURE_OBSERVER)[0];
        if(!observer) {
			return;
		}
	}

    collectCensus() {
    }

    runActivities() {
    }

    questEnd() {
	}

    invalidateQuestCache() {
	}

}

global.PowerMiningQuest = PowerMiningQuest;
