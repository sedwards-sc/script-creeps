/* jshint esversion: 6 */

const REMEMBER_ENERGY_KEY = "remEnergyId";
const REMEMBER_ROAD_KEY = "remRoadId";
const REMEMBER_CONSTRUCTION_KEY = "remConId";
const STORAGE_THRESHOLD = 5000;
const ROAD_BLOCK_SIZE = 10;

class PavingQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('paving', PRIORITY_TRIVIAL, id, flag, colony);
	}

	initQuest() {
		this.maintainRooms = {};
		this.maintainRooms[this.flag.pos.roomName] = true;
		this.colony.poiList.forEach(
			poi => {
				let roomName;
				if(poi instanceof RoomPosition) {
					roomName = poi.roomName;
				} else if(poi.pos && poi.pos instanceof RoomPosition) {
					roomName = poi.pos.roomName;
				} else {
					return false;
				}
				this.maintainRooms[roomName] = true;
			}
		);
		this.maintainRoomsList = Object.keys(this.maintainRooms);

		if(this.memory.cache.partsRequired === undefined) {
			let sum = 0;
			this.maintainRoomsList.forEach(
				roomName => {
					let room = Game.rooms[roomName];
					if(room) {
						sum += _.sum(room.findStructures(STRUCTURE_ROAD), r => r.hitsMax);
					}
				}
			);
			this.memory.cache.partsRequired = Math.max(Math.ceil(sum / 500000), 1);
		}

		if(this.memory.cache.pavingCycle === undefined) {
			this.memory.cache.pavingCycle = true;
			let spotsToPave = [];

			let pavingStructures = [];
			pavingStructures = pavingStructures.concat(
				this.flag.room.findStructures(STRUCTURE_SPAWN),
				this.flag.room.findStructures(STRUCTURE_EXTENSION),
				this.flag.room.findStructures(STRUCTURE_STORAGE),
				this.flag.room.findStructures(STRUCTURE_TERMINAL),
				this.flag.room.findStructures(STRUCTURE_LINK),
				this.flag.room.findStructures(STRUCTURE_TOWER)
			);
			pavingStructures = _.filter(pavingStructures, s => s.my);
			pavingStructures.forEach(
				structure => {
					structure.pos.openAdjacentNonDiagonalSpots(true).forEach(
						pos => {
							let notAConstructionSite = pos.lookFor(LOOK_CONSTRUCTION_SITES).length === 0;
							let notARoad = pos.lookForStructure(STRUCTURE_ROAD) === undefined;
							let notExit = !pos.isNearExit(0);
							if(notAConstructionSite && notARoad && notExit) {
								spotsToPave.push(pos);
							}
						}
					);
				}
			);

			this.colony.poiList.forEach(
				poi => {
					let pos;
					if(poi instanceof RoomPosition) {
						pos = poi;
					} else if(poi.pos && poi.pos instanceof RoomPosition) {
						pos = poi.pos;
					} else {
						return false;
					}

					// calculate path between main spawn and POI position
					// this might be expensive for a lot of paths.... maybe one path per cycle?
					const ROAD_COST = 1;
					const PLAIN_COST = 2;
					const SWAMP_COST = 5;
					let pathFinderResults = PathFinder.search(this.spawnGroup.pos, {pos: pos, range: 1}, {
						plainCost: PLAIN_COST,
						swampCost: SWAMP_COST,
						maxOps: 8000,
						roomCallback: function(roomName) {
							let room = Game.rooms[roomName];
							if(!room) {
								return;
							}

							let costs = new PathFinder.CostMatrix();

							room.findConstructionSitesByType(STRUCTURE_ROAD).forEach(roadSite => costs.set(roadSite.pos.x, roadSite.pos.y, ROAD_COST));

							room.findAllStructures().forEach(function(structure) {
								if(structure.structureType === STRUCTURE_ROAD) {
									costs.set(structure.pos.x, structure.pos.y, ROAD_COST);
								} else if(structure.structureType !== STRUCTURE_CONTAINER && (structure.structureType !== STRUCTURE_RAMPART || !structure.my)) {
									// Can't walk through non-walkable buildings
									costs.set(structure.pos.x, structure.pos.y, 0xff);
								}
							});
							return costs;
						},
					});

					// push positions in path to the spotsToPave list
					// spotsToPave = spotsToPave.concat(pathFinderResults.path);
					pathFinderResults.path.forEach(
						pos => {
							let notAConstructionSite = pos.lookFor(LOOK_CONSTRUCTION_SITES).length === 0;
							let notARoad = pos.lookForStructure(STRUCTURE_ROAD) === undefined;
							let notExit = !pos.isNearExit(0);
							if(notAConstructionSite && notARoad && notExit) {
								spotsToPave.push(pos);
							}
						}
					);
				}
			);

			// TODO: make spotsToPave unique/distinct
			let sitesCreated = 0;
			spotsToPave.forEach(
				pos => {
					if(sitesCreated >= ROAD_BLOCK_SIZE) return false;
					// this.flag.room.visual.circle(pos, {fill: 'transparent', radius: 0.55, stroke: 'red'});
					// Game.rooms[pos.roomName].visual.circle(pos, {fill: 'transparent', radius: 0.55, stroke: 'green'});
					let room = Game.rooms[pos.roomName];
					if(room && room.createConstructionSite(pos, STRUCTURE_ROAD) === OK) sitesCreated++;
				}
			);

			if(spotsToPave.length === 0) {
				this.memory.cache.colonyPaved = true;
			}
		}

		if(this.memory.cache.colonyPaved) {
			this.colony.paved = true;
		}

		this.pavers = [];
	}

	runCensus() {
		let options = {};
		options.prespawn = 0;
		if(this.colony.flag.room.storage) {
			options.destination = this.colony.flag.room.storage;
		}
		// TODO: only build with less MOVE parts after colony is paved
		this.pavers = this.attendance("paver_" + this.id, this.spawnGroup.workerBodyRatio(1, 3, 4, 1, this.memory.cache.partsRequired), 1, options);
	}

	runActivities() {
		for(let creep of this.pavers) {
			if(!creep.spawning) {
				this.paverActions(creep)
			}
		}
	}

	questEnd() {
	}

	paverActions(creep) {
		if(creep.fleeHostiles()) {
			return;
		}

		// let withinRoom = creep.pos.roomName === this.flag.pos.roomName;
		// if(!withinRoom) {
		// 	creep.blindMoveTo(this.flag);
		// 	return;
		// }

		if(!creep.hasLoad()) {
			let findEnergy = () => {
				let energySources = [];
				if(creep.room.storage && creep.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > STORAGE_THRESHOLD) {
					energySources.push(creep.room.storage);
				}
				if(creep.room.terminal && creep.room.terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
					energySources.push(creep.room.terminal);
				}
				// TODO: check for minimum pile size based on creep's carry capacity
				energySources = energySources.concat(
					_.filter(creep.room.findDroppedResources(), (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 20)
				);
				energySources = energySources.concat(
					_.filter(creep.room.findTombstones(), (t) => t.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
				);
				energySources = energySources.concat(
					_.filter(creep.room.findRuins(), (r) => r.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
				);
				energySources = energySources.concat(
					_.filter(creep.room.findStructures(STRUCTURE_CONTAINER), (s) => s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
				);
				energySources = energySources.concat(
					_.filter(creep.room.findStructures(STRUCTURE_LINK), (s) => s.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
				);
				if(energySources.length > 0) {
					return creep.pos.findClosestByPath(energySources);
				}
			};
			let forgetEnergy = (e) => {
				if(e instanceof Resource) {
					if(e.amount > 20) {
						return false;
					}
				} else if(e.store && e.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
					return false;
				}
				return true;
			};
			let energySource = creep.rememberStructure(findEnergy, forgetEnergy, REMEMBER_ENERGY_KEY, true);

			if(energySource) {
				if(creep.pos.isNearTo(energySource)) {
					creep.takeResource(energySource, RESOURCE_ENERGY);
					delete creep.memory[REMEMBER_ENERGY_KEY];
				} else {
					creep.blindMoveTo(energySource);
				}
			} else {
				creep.say("no energy");
				creep.idleOffRoad(this.flag);
			}
			return;
		}

		// I'm in the room and I have energy

		let findRoad = () => {
			let roads = _.filter(creep.room.findStructures(STRUCTURE_ROAD), (s) => s.hits < s.hitsMax - 1000);
			if(roads.length) {
				return creep.pos.findClosestByPath(roads);
			}

			this.maintainRoomsList.forEach(
				roomName => {
					let room = Game.rooms[roomName];
					if(room) {
						roads = roads.concat(
							_.filter(room.findStructures(STRUCTURE_ROAD), (s) => s.hits < s.hitsMax - 1000)
						);
					}
				}
			);
			return _.first(roads);
		};
		let forgetRoad = (s) => s.hits === s.hitsMax;
		let target = creep.rememberStructure(findRoad, forgetRoad, REMEMBER_ROAD_KEY);

		if(!target) {
			// look for construction site roads if there are no roads to repair
			let findRoadUnderConstruction = () => {
				let roadSites = creep.room.findConstructionSitesByType(STRUCTURE_ROAD);
				if(roadSites.length) {
					return creep.pos.findClosestByPath(roadSites);
				}

				this.maintainRoomsList.forEach(
					roomName => {
						let room = Game.rooms[roomName];
						if(room) {
							roadSites = roadSites.concat(room.findConstructionSitesByType(STRUCTURE_ROAD));
						}
					}
				);
				return _.first(roadSites);
			};
			let forgetRoadUnderConstruction = (s) => s.progress === s.progressTotal;
			target = creep.rememberStructure(findRoadUnderConstruction, forgetRoadUnderConstruction, REMEMBER_CONSTRUCTION_KEY);
		}

		if(!target) {
			// no roads to repair or build. fill up and head to flag
			let isFull = creep.store.getUsedCapacity() === creep.store.getCapacity();
			creep.memory.hasLoad = isFull;
			if(isFull) {
				if(creep.pos.inRangeTo(this.flag, 3)) {
					creep.say('idle');
					creep.yieldRoad(this.flag);
				} else {
					creep.blindMoveTo(this.flag);
				}
			}
			return;
		}

		// and I have a target

		let range = creep.pos.getRangeTo(target);
		if(range > 3) {
			creep.blindMoveTo(target);
			// repair any damaged road I'm standing on
			let road = creep.pos.lookForStructure(STRUCTURE_ROAD);
			if(road && road.hits < road.hitsMax - 100) {
				creep.repair(road);
			}
			return;
		}

		// and I'm in range

		if(target instanceof StructureRoad) {
			creep.repair(target);
		} else if(target instanceof ConstructionSite) {
			creep.build(target);
		} else {
			creep.errorLog(`unknown target: ${target}`, ERR_INVALID_TARGET, 5);
			delete creep.memory[REMEMBER_ROAD_KEY];
			delete creep.memory[REMEMBER_CONSTRUCTION_KEY];
		}
		creep.yieldRoad(target);
	}
}

global.PavingQuest = PavingQuest;
