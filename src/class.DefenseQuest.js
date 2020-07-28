/* jshint esversion: 6 */

class DefenseQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('defense', PRIORITY_HIGH, id, flag, colony);
	}

	initQuest() {
		this.towers = this.flag.room.findStructures(STRUCTURE_TOWER);

		this.hostiles = this.flag.room.hostiles;
		if(this.hostiles.length > 0) {
			let username = _.first(this.hostiles).owner.username;
			if(username !== 'Invader') {
				let roomName = this.flag.room.name;
				Game.notify(`User ${username} spotted in room ${roomName} at ${timeLink(roomName, Game.time)}`);
			}
		}
	}

	runCensus() {
	}

	runActivities() {
		if(this.hostiles.length > 0) {
			let firstHostile = _.first(this.hostiles);
			this.towers.forEach(tower => tower.attack(firstHostile));
		} else {
			this.towerRepair();
		}
	}

	questEnd() {
	}

	invalidateQuestCache() {
	}

	towerRepair() {
		let towersWithEnergy = _.filter(this.towers, (structure) => structure.energy > TOWER_RESERVE_ENERGY);
		if(towersWithEnergy.length === 0) {
			return;
		}

		let room = this.flag.room;

		// check ramparts
		let repairTargets = _.filter(room.findStructures(STRUCTURE_RAMPART), (structure) => structure.hits < MINIMUM_RAMPART_HEALTH);

		// check walls
		if(!isArrayWithContents(repairTargets)) {
			repairTargets = _.filter(room.findStructures(STRUCTURE_WALL), (structure) => structure.hits < MINIMUM_WALL_HEALTH);
		}

		// check containers and roads
		if(!isArrayWithContents(repairTargets)) {
			repairTargets = _.filter(room.findStructures(STRUCTURE_CONTAINER).concat(room.findStructures(STRUCTURE_ROAD)), (structure) => structure.hits < structure.hitsMax * 0.5);
		}

		if(!isArrayWithContents(repairTargets)) {
			// nothing to repair
			return;
		}

		let topRepairTarget = _.first(_.sortBy(repairTargets, (structure) => structure.hits));
		towersWithEnergy.forEach((tower) => tower.repair(topRepairTarget));
	}
}

global.DefenseQuest = DefenseQuest;
