/* jshint esversion: 6 */

class Quest {

	/**
	 *
	 */
	constructor(name, priority, id, flag, colony, allowSpawn = true) {
		this.name = name;
		this.priority = priority;
		this.id = id;
		this.flag = flag;
		this.colony = colony;
		//Object.defineProperty(this, "flag", { enumerable: false, value: epic.flag });
		//Object.defineProperty(this, "room", { enumerable: false, value: epic.flag.room });
		//Object.defineProperty(this, "spawnGroup", { enumerable: false, value: epic.spawnGroup, writable: true });
		//Object.defineProperty(this, "sources", { enumerable: false, value: epic.sources });

		this.nameId = this.name + "_" + this.id;

		this.spawnGroup = colony.getSpawnGroup();

		this.allowSpawn = allowSpawn;

		// TODO: ensure using quest flag for vision doesn't interfere with vision spawning (i.e. in attendance)
		if(this.flag.room) {
			this.hasVision = true;
		}

		if(!this.flag.memory) {
			this.flag.memory = {};
		}
		this.memory = flag.memory;

		// initialize memory to be used by this quest
		if(!this.memory.roster) {
			this.memory.roster = {};
		}
	}

    initQuest() {
	}

    runCensus() {
    }

    runActivities() {
    }

    questEnd() {
	}

    invalidateQuestCache() {
	}

	/**
     * maintain creep roster for this quest
     * @param roleName - Used to find creeps belonging to this role, examples: miner, energyCart
     * @param body - the body to be used if a new creep needs to be spawned
     * @param max - how many creeps are currently desired, pass 0 to halt spawning
     * @param options - Optional parameters like prespawn interval, whether to disable attack notifications, etc.
     * @returns {Creep[]}
     */
    attendance(roleName, body, max, options) {
        if(!options) {
			options = {};
		}
        let roleArray = [];
        if(!this.memory.roster[roleName]) {
			this.memory.roster[roleName] = this.findRoleCreeps(roleName);
		}

        let count = 0;
        for(let i = 0; i < this.memory.roster[roleName].length; i++ ) {
            let creepName = this.memory.roster[roleName][i];
            let creep = Game.creeps[creepName];
            if(creep) {
                // newer code to implement waypoints/boosts
                //let prepared = this.prepCreep(creep, options);
                //if (prepared) {
                    roleArray.push(creep);
                //}

                let ticksNeeded = 0;
                if(options.prespawn !== undefined) {
                    ticksNeeded += creep.body.length * 3;
                    ticksNeeded += options.prespawn;
                }
                if(creep.ticksToLive > ticksNeeded || creep.spawning === true) {
					count++;
				}
            } else {
                this.memory.roster[roleName].splice(i, 1);
                Memory.creeps[creepName] = undefined;
                i--;
            }
        }

        if(count < max && this.allowSpawn && this.spawnGroup.isAvailable && (this.hasVision || options.blindSpawn)) {
            let creepName = this.colony.name + "_" + roleName + "_" + Math.floor(Math.random() * 100);
            let outcome = this.spawnGroup.spawn(body, creepName, options.memory, options.reservation);
            if(outcome === OK) {
				this.memory.roster[roleName].push(creepName);
			}
        }

        return roleArray;
    }

	findRoleCreeps(roleName) {
		let creepNames = [];
		for(let creepName in Game.creeps) {
			if(creepName.indexOf(this.colony.name + "_" + roleName + "_") > -1) {
				creepNames.push(creepName);
			}
		}
		return creepNames;
	}

	log(msg, severity = 2) {
		return Logger.log(`${this.colony.flag.pos.roomName}::${this.colony.name}::${this.nameId}, msg: ${msg}`, severity);
	}

	errorLog(msg, errCode = -10, severity = 3) {
		return Logger.log(`!!!Error!!! ${this.colony.flag.pos.roomName}::${this.colony.name}::${this.nameId}, msg: ${msg} (${errorCodeToText(errCode)})`, severity);
	}

}

global.Quest = Quest;
