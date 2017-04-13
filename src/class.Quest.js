/* jshint esversion: 6 */

class Quest {

	/**
	 *
	 */
	constructor(name, epic, allowSpawn = true) {
		this.name = name;
		this.epic = epic;
		//Object.defineProperty(this, "flag", { enumerable: false, value: epic.flag });
		//Object.defineProperty(this, "room", { enumerable: false, value: epic.flag.room });
		//Object.defineProperty(this, "spawnGroup", { enumerable: false, value: epic.spawnGroup, writable: true });
		//Object.defineProperty(this, "sources", { enumerable: false, value: epic.sources });

		this.spawnGroup = empire.getSpawnGroup(epic.flag.pos.roomName);

		this.allowSpawn = allowSpawn;

		if(this.room) {
			this.hasVision = true;
		}

		if(!epic.flag.memory[this.name]) {
			epic.flag.memory[this.name] = {};
		}
		this.memory = epic.flag.memory[this.name];

		// initialize memory to be used by this quest
        if(!this.memory.roster) {
			this.memory.roster = {};
		}
	}

    initQuest() {
	}

    collectCensus() {
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
     * @param getBody - function that returns the body to be used if a new creep needs to be spawned
     * @param max - how many creeps are currently desired, pass 0 to halt spawning
     * @param options - Optional parameters like prespawn interval, whether to disable attack notifications, etc.
     * @returns {Creep[]}
     */
    attendance(roleName, getBody, max, options) {
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
                if(creep.ticksToLive > ticksNeeded) {
					count++;
				}
            } else {
                this.memory.roster[roleName].splice(i, 1);
                Memory.creeps[creepName] = undefined;
                i--;
            }
        }

        if(count < max && this.allowSpawn && this.spawnGroup.isAvailable && (this.hasVision || options.blindSpawn)) {
            let creepName = this.epic.name + "_" + roleName + "_" + Math.floor(Math.random() * 100);
            let outcome = this.spawnGroup.spawn(getBody(), creepName, options.memory, options.reservation);
            if(_.isString(outcome)) {
				this.memory.roster[roleName].push(creepName);
			}
        }

        return roleArray;
    }

	findRoleCreeps(roleName) {
		let creepNames = [];
		for(let creepName in Game.creeps) {
			if(creepName.indexOf(this.epic.name + "_" + roleName + "_") > -1) {
				creepNames.push(creepName);
			}
		}
		return creepNames;
	}

}

global.Quest = Quest;
