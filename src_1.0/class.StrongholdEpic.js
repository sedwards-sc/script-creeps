/* jshint esversion: 6 */

class StrongholdEpic extends Epic {

	/**
	 *
	 * @param flag - quests will operate relative to this flag, use the following naming convention: "epicType_epicName"
	 * @param type - first part of flag.name, used to determine which epic class to instantiate
	 * @param name - second part of flag.name, should be unique amongst all other operation names (e.g. pokemon)
	 */
	constructor(flag, type, name) {
		super(flag, type, name);
		this.priority = PRIORITY_HIGH;
	}

	/**
	 * Stronghold Epic initializiation
	 */
    initEpic() {

		this.addQuest(new PowerMiningQuest(this));

	}

	/**
	 * Stronghold Epic end phase
	 */
    epicEnd() {
	}

	/**
	 * Stronghold Epic cache invalidation
	 */
    invalidateEpicCache() {
	}

}

global.StrongholdEpic = StrongholdEpic;
