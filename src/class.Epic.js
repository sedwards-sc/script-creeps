/* jshint esversion: 6 */

class Epic {

	/**
	 *
	 * @param flag - quests will operate relative to this flag, use the following naming convention: "epicType_epicName"
	 * @param type - first part of flag.name, used to determine which epic class to instantiate
	 * @param name - second part of flag.name, should be unique amongst all other operation names (e.g. pokemon)
	 */
	constructor(flag, type, name) {
		this.flag = flag;
        this.name = name;
        this.type = type;
		Object.defineProperty(this, "memory", { enumerable: false, value: flag.memory });
		if(!this.quests) {
			this.quests = {};
		}
        // variables that require vision (null check where appropriate)
        if(this.flag.room) {
            this.hasVision = true;
            //this.sources = _.sortBy(this.flag.room.sources, (s) => s.pos.getRangeTo(this.flag));
            //this.mineral = _.head(this.flag.room.mineral);
        }
	}

	/**
     * Initialization Phase - initialize epic variables and instantiate quests
     */
    init() {
        try {
            this.initEpic();
        } catch(e) {
            Logger.errorLog("error caught in initEpic phase, epic:" + this.name, ERR_TIRED, 4);
            Logger.log(e.stack, 4);
        }

        for(let questName in this.quests) {
            try {
                this.quests[questName].initQuest();
            } catch(e) {
                Logger.errorLog("error caught in initQuest phase, epic:" + this.name + ", quest:" + questName, ERR_TIRED, 4);
                Logger.log(e.stack, 4);
            }
        }
    }
	/**
	 * implement Epic-type specific initializiation
	 */
    initEpic() {
	}

	/**
     *  Census Collection Phase - find the creeps required for this epic's quests (otherwise spawn them)
     */
    collectCensus() {
        // collect quest censuses
        for(let questName in this.quests) {
            try {
                this.quests[questName].collectCensus();
            } catch(e) {
                Logger.errorLog("error caught in census collection phase, epic:" + this.name + ", quest:" + questName, ERR_TIRED, 4);
                Logger.log(e.stack, 4);
            }
        }
    }

	/**
     * Activity Phase - run the activities for each quest
     */
    runActivities() {
        // run quest activities
        for(let questName in this.quests) {
            try {
                this.quests[questName].runActivities();
            } catch(e) {
                Logger.errorLog("error caught in activities phase, epic:" + this.name + ", quest:" + questName + " in room " + this.flag.pos.roomName, ERR_TIRED, 4);
                Logger.log(e.stack, 4);
            }
        }
    }

	/**
     * End Phase - run end phases for all quests for this epic and then for this epic
     */
    theEnd() {
        // quest end phases
        for(let questName in this.quests) {
            try {
                this.quests[questName].questEnd();
            } catch(e) {
                Logger.errorLog("error caught in quest end phase, epic:" + this.name + ", quest:" + questName, ERR_TIRED, 4);
                Logger.log(e.stack, 4);
            }
        }

        try {
            this.epicEnd();
        } catch(e) {
            Logger.errorLog("error caught in end epic phase, epic:" + this.name, ERR_TIRED, 4);
            Logger.log(e.stack, 4);
        }
    }
	/**
	 * implement Epic-type specific end phase
	 */
    epicEnd() {
	}

	/**
     * Cache Invalidation Phase - occasionally invalidate caches of epic and it's quests (see constants for probability setting)
     */
    invalidateCache() {
        if(Math.random() < CACHE_INVALIDATION_CHANCE) {
            for(let questName in this.quests) {
                try {
                    this.quests[questName].invalidateQuestCache();
                } catch(e) {
                    Logger.errorLog("error caught in quest cache invalidation phase, epic:" + this.name + ", quest:" + questName, ERR_TIRED, 4);
                    Logger.log(e.stack, 4);
                }
            }

            try {
                this.invalidateEpicCache();
            } catch(e) {
                Logger.errorLog("error caught in epic cache invalidation phase, epic:" + this.name, ERR_TIRED, 4);
                Logger.log(e.stack, 4);
            }
        }
    }
	/**
	 * implement Epic-type specific cache invalidation
	 */
    invalidateEpicCache() {
	}

	/**
     * Add quest to this epic
     * @param quest
     */
    addQuest(quest) {
        // each quest name must be unique
		let questName = quest.name;
		if(this.quests.hasOwnProperty(questName)) {
			Logger.errorLog(`quest with name ${questName} already exists (epic: ${this.name}), please use a different name`, ERR_NAME_EXISTS, 4);
		} else {
			this.quests[questName] = quest;
		}
    }

}

global.Epic = Epic;
