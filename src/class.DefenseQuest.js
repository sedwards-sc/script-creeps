/* jshint esversion: 6 */

class DefenseQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('defense', PRIORITY_HIGH, id, flag, colony);
	}

	initQuest() {
		this.hostiles = this.flag.room.hostiles;
		if(this.hostiles.length > 0) {
			let username = _.first(this.hostiles).owner.username;
			if(username !== 'Invader') {
				let roomName = this.flag.room.name;
				Game.notify(`User ${username} spotted in room ${roomName} at ${timeLink(roomName, Game.time)}`);
			}
		}

		this.towers = this.flag.room.findStructures(STRUCTURE_TOWER);

		this.defenders = [];
	}

	runCensus() {
		let maxDefenders = 0;
		if(this.hostiles.length > 0) {
			maxDefenders = 1;
		}
		// TODO: adjust defenders so they have more attack with some toughness (just attack and move?)
		// TODO: cache bodyRatio results so they aren't calculated every time
		this.defenders = this.attendance("defender_" + this.id, this.spawnGroup.bodyRatio({tough: 2, attack: 1, move: 3}, 1), maxDefenders);
	}

	runActivities() {
		this.defenders.forEach(defender => this.defenderActions(defender));

		if(this.hostiles.length > 0) {
			let firstHostile = _.first(this.hostiles);
			this.towers.forEach(tower => tower.attack(firstHostile));
		} else {
			this.towerRepair();
		}
	}

	questEnd() {
	}

	defenderActions(defender) {
		if(this.hostiles.length > 0) {
			let target = defender.pos.findClosestByRange(this.hostiles);
			if(defender.attack(target) === ERR_NOT_IN_RANGE) {
				defender.moveTo(target);
			}
			return;
		}
		defender.idleOffRoad(this.flag);
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
