/* jshint esversion: 6 */

class Colony {

	/**
	 *
	 * @param name - second part of flag.name, should be unique amongst all other colony names (e.g. pokemon)
	 * @param flag - quests will operate relative to this flag, use the following naming convention: "colony_colonyName"
	 */
	constructor(name, flag) {
		this.name = name;
		this.flag = flag;
		// TODO: adjust colony priority with flag attributes or something
		this.priority = PRIORITY_MEDIUM;

		Object.defineProperty(this, "memory", { enumerable: false, value: flag.memory });
		if(!this.memory.cache) {
			this.memory.cache = {};
		}

		if(!this.quests) {
			this.quests = {};
		}

		if(!this.questList) {
			this.questList = [];
		}

		// variables that require vision (null check where appropriate)
		if(this.flag.room) {
			this.hasVision = true;
			//this.sources = _.sortBy(this.flag.room.sources, (s) => s.pos.getRangeTo(this.flag));
			//this.mineral = _.head(this.flag.room.mineral);
		}
	}

	/**
	 * Initialization Phase - initialize colony variables and instantiate quests
	 */
	init() {
		try {
			this.initColony();
		} catch(e) {
			Logger.errorLog("error caught in initColony phase, colony:" + this.name, ERR_TIRED, 5);
			Logger.log(e.stack, 5);
		}

		this.prioritizedQuestList = _.sortBy(this.questList, (q) => q.priority);

		for(let quest of this.prioritizedQuestList) {
			try {
				quest.initQuest();
			} catch(e) {
				Logger.errorLog("error caught in initQuest phase, colony:" + this.name + ", quest:" + quest.nameId, ERR_TIRED, 5);
				Logger.log(e.stack, 5);
			}
		}
	}
	/**
	 * implement Colony-type specific initializiation
	 */
	initColony() {
		// gather flag data, instantiate quests
		// TODO: move quest flag finding to loopHelper. instatiation should happen here
		let questList = {};
		for(let flagName in Game.flags) {
			if(flagName.substring(0, this.name.length) === this.name) {
				// flag is for this colony, look for matching quest class
				for(let questClassName in QUEST_CLASSES) {
					if(!QUEST_CLASSES.hasOwnProperty(questClassName)) {
						continue;
					}
					let flagQuestString = flagName.substring(flagName.indexOf("_") + 1);
					if(flagQuestString.substring(0, questClassName.length) === questClassName) {
						// found matching quest class
						let questClass = QUEST_CLASSES[questClassName];
						let flag = Game.flags[flagName];
						let questId = flagQuestString.substring(flagQuestString.indexOf("_") + 1);

						if(!this.quests[questClassName]) {
							this.quests[questClassName] = {};
						}

						if(this.quests[questClassName].hasOwnProperty(questId)) {
							// TODO: include colony and quest type info
							Logger.errorLog(`quest with ID ${questId} already exists, please use a different ID`, ERR_NAME_EXISTS, 4);
							continue;
						}

						let quest;
						try {
							quest = new questClass(questId, flag, this);
						} catch (e) {
							// TODO: include flag info
							Logger.errorLog("error parsing flag name and bootstrapping quest", ERR_NOT_FOUND, 4);
							Logger.log(e, 4);
							continue;
						}

						this.quests[questClassName][questId] = quest;
						this.questList.push(quest);
					}
				}
			}
		}
	}

	/**
	 *  Census Phase - find the creeps required for this colony's quests (otherwise spawn them)
	 */
	runCensus() {
		// run census for quests
		for(let quest of this.prioritizedQuestList) {
			try {
				quest.runCensus();
			} catch(e) {
				Logger.errorLog("error caught in census phase, colony:" + this.name + ", quest:" + quest.nameId, ERR_TIRED, 5);
				Logger.log(e.stack, 5);
			}
		}
	}

	/**
	 * Activity Phase - run the activities for each quest
	 */
	runActivities() {
		// run quest activities
		for(let quest of this.prioritizedQuestList) {
			try {
				quest.runActivities();
			} catch(e) {
				Logger.errorLog("error caught in activities phase, colony:" + this.name + ", quest:" + quest.nameId + " in room " + this.flag.pos.roomName, ERR_TIRED, 5);
				Logger.log(e.stack, 5);
			}
		}
	}

	/**
	 * End Phase - run end phases for all quests for this colony and then for this colony
	 */
	theEnd() {
		// quest end phases
		for(let quest of this.prioritizedQuestList) {
			try {
				quest.questEnd();
			} catch(e) {
				Logger.errorLog("error caught in quest end phase, colony:" + this.name + ", quest:" + quest.nameId, ERR_TIRED, 5);
				Logger.log(e.stack, 5);
			}
		}

		try {
			this.colonyEnd();
		} catch(e) {
			Logger.errorLog("error caught in end colony phase, colony:" + this.name, ERR_TIRED, 5);
			Logger.log(e.stack, 5);
		}
    }
	/**
	 * implement Colony-type specific end phase
	 */
    colonyEnd() {
	}

	/**
     * Cache Invalidation Phase - occasionally invalidate caches of colony and it's quests (see constants for probability setting)
     */
	 invalidateCache() {
		for(let quest of this.prioritizedQuestList) {
			try {
				quest.invalidateQuestCache();
			} catch(e) {
				Logger.errorLog("error caught in quest cache invalidation phase, colony:" + this.name + ", quest:" + quest.nameId, ERR_TIRED, 5);
				Logger.log(e.stack, 5);
			}
		}

		if(Math.random() < CACHE_INVALIDATION_CHANCE) {
			try {
				this.invalidateColonyCache();
			} catch(e) {
				Logger.errorLog("error caught in colony cache invalidation phase, colony:" + this.name, ERR_TIRED, 5);
				Logger.log(e.stack, 5);
			}
		}
	}
	/**
	 * implement Colony-type specific cache invalidation
	 */
	invalidateColonyCache() {
		Logger.log("clearing colony cache for " + this.name, 1);
		this.memory.cache = {};
	}

	getSpawnGroup() {
		if(this.spawnGroup) {
			return this.spawnGroup;
		} else {
			let room = Game.rooms[this.flag.pos.roomName];
			if(room) {
				let roomSpawns = room.findStructures(STRUCTURE_SPAWN);
				let ownedSpawns = false;
				for(let i in roomSpawns) {
					if(roomSpawns[i].my === true) {
						ownedSpawns = true;
						break;
					}
				}
				if(ownedSpawns === true) {
					this.spawnGroup = new SpawnGroup(room);
					return this.spawnGroup;
				}
			}
		}
	}
}

global.Colony = Colony;
