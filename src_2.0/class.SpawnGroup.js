/* jshint esversion: 6 */

class SpawnGroup {

    constructor(room) {
        this.room = room;
		// TODO: update to use cached structure list
        this.spawns = room.find(FIND_MY_SPAWNS);
        if(!this.room.memory.spawnMemory) {
			this.room.memory.spawnMemory = {};
		}
        this.memory = this.room.memory.spawnMemory;
		// TODO: is this used anywhere?
        this.extensions = room.findStructures(STRUCTURE_EXTENSION);
        this.manageSpawnLog();
        this.availableSpawnCount = this.getSpawnAvailability();
        this.isAvailable = this.availableSpawnCount > 0;
        this.currentSpawnEnergy = this.room.energyAvailable;
        this.maxSpawnEnergy = this.room.energyCapacityAvailable;
        this.pos = _.head(this.spawns).pos;
    }

    spawn (build, name, memory, reservation) {
        let outcome;
        this.isAvailable = false;

        if(reservation) {
            if(this.availableSpawnCount < reservation.spawns) {
				return ERR_BUSY;
			}
            if(this.currentSpawnEnergy < reservation.currentEnergy) {
				return ERR_NOT_ENOUGH_RESOURCES;
			}
        }

        for(let spawn of this.spawns) {
            if(spawn.spawning === null) {
                outcome = spawn.spawnCreep(build, name, {memory: memory});

                if(Memory.config.muteSpawn) {
					break; // early
				}

				if(outcome === OK) {
                    spawn.log(`building ${name}`, 2);
                } else if(outcome === ERR_INVALID_ARGS) {
					spawn.errorLog(`invalid args for creep\nbuild: ${build}\nname: ${name}\ncount: ${build.length}`, outcome, 5);
                } else if(outcome === ERR_NOT_ENOUGH_RESOURCES) {
                    if (Game.time % 10 === 0) {
						spawn.errorLog(`not enough energy for ${name}, cost: ${SpawnGroup.calculateBodyCost(build)}, current: ${this.currentSpawnEnergy}, max: ${this.maxSpawnEnergy}`, outcome, 4);
                    }
                } else if(outcome !== ERR_NAME_EXISTS) {
                    spawn.errorLog(`had error spawning ${name}`, outcome, 5);
                }

                break;
            }
        }

        return outcome;
    }

    getSpawnAvailability() {
        let count = 0;
        for(let spawn of this.spawns) {
            if(spawn.spawning === null) {
                count++;
            }
        }
        this.memory.log.availability += count;
        Memory.stats["spawnGroups." + this.room.name + ".idleCount"] = count;
        return count;
    }

    static calculateBodyCost(body) {
        let sum = 0;
        for(let part of body) {
            sum += BODYPART_COST[part];
        }
        return sum;
    }

    canCreateCreep(body) {
        let cost = SpawnGroup.calculateBodyCost(body);
        return (cost <= this.currentSpawnEnergy);
    }

    // proportion allows you to scale down the body size if you don't want to use all of your spawning energy
    // for example, proportion of .5 would return the max units per cost if only want to use half of your spawning capacity
    maxUnitsPerCost(unitCost, proportion = 1) {
        return Math.floor((this.maxSpawnEnergy * proportion) / unitCost);
    }

    maxUnits(body, proportion = 1) {
        let cost = SpawnGroup.calculateBodyCost(body);
        return Math.min(this.maxUnitsPerCost(cost, proportion), Math.floor(50 / body.length));
    }

    manageSpawnLog() {
        if(!this.memory.log) {
			this.memory.log = {
				availability: 0,
				history: [],
				longHistory: []
			};
		}

        if(Game.time % 100 !== 0) {
			return; // early
		}

        let log = this.memory.log;
        let average = log.availability / 100;
        log.availability = 0;
        /*
        if (average > 1) console.log("SPAWNING:", this.room, "not very busy (avg", average, "idle out of",
            this.spawns.length, "), perhaps add more harvesting");
        if (average < .1) console.log("SPAWNING:", this.room, "very busy (avg", average, "idle out of",
            this.spawns.length, "), might want to reduce harvesting");
            */
        log.history.push(average);
        while(log.history.length > 5) {
			log.history.shift();
		}

        if (Game.time % 500 !== 0) {
			return; // early
		}

        let longAverage = _.sum(log.history) / 5;
        log.longHistory.push(longAverage);
        while (log.longHistory.length > 5) {
			log.longHistory.shift();
		}
    }

    showHistory() {
        Logger.log("Average availability in", this.room.name, "the last 5 creep generations (1500 ticks):");
        Logger.log(this.memory.log.history);
        Logger.log("Average availability over the last 75000 ticks (each represents a period of 15000 ticks)");
        Logger.log(this.memory.log.longHistory);
    }

	/*
	// broken?
    averageAvailability() {
        if(this.memory.log.history.length === 0) {
            return 0.1;
        }
        return _.last(this.memory.log.history);
    }
	*/
}

global.SpawnGroup = SpawnGroup;
