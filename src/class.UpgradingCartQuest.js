/* jshint esversion: 6 */

class UpgradingCartQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('upgradingCart', PRIORITY_LOW, id, flag, colony);
	}

	initQuest() {
		this.carts = [];
	}

	runCensus() {
		// TODO: dynamically size creep body based on distance between quest flag and colony room controller
		this.carts = this.attendance(this.nameId, [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 1, {prespawn: 0});
	}

	runActivities() {
		for(let creep of this.carts) {
			if(!creep.spawning) {
				this.cartActions(creep)
			}
		}
	}

	questEnd() {
	}

	invalidateQuestCache() {
	}

	cartActions(creep) {
		if(creep.fleeHostiles()) {
			return;
		}

		if(creep.hasLoad()) {
			let colonyController = this.colony.flag.room.controller;
			if(creep.upgradeController(colonyController) === ERR_NOT_IN_RANGE) {
				creep.moveTo(colonyController);
			} else {
				creep.yieldRoad(colonyController);
			}
			return;
		}

		let inPickUpRoom = creep.pos.roomName === this.flag.pos.roomName;
		if(!inPickUpRoom) {
			creep.blindMoveTo(this.flag);
			return;
		}

		let findSource = () => {
			return this.flag.pos.findClosestByRange(FIND_SOURCES);
		};
		let forgetSource = (s) => {
			return false;
		};
		let source = creep.rememberStructure(findSource, forgetSource, 'sourceStructureId', true);
		if(!source) {
			creep.errorLog('could not find source near flag', ERR_NOT_FOUND, 4);
			return;
		}

		if(creep.pos.getRangeTo(source) > 3) {
			creep.blindMoveTo(source);
			return;
		}

		let energyPiles = _.filter(creep.room.findDroppedResources(), (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 20 && source.pos.getRangeTo(r) <= 3)
		if(energyPiles.length > 0) {
			let target = creep.pos.findClosestByRange(energyPiles);
			if(creep.pos.isNearTo(target)) {
				creep.takeResource(target, RESOURCE_ENERGY);
			} else {
				creep.blindMoveTo(target);
			}
		} else {
			creep.yieldRoad(source);
			creep.say('waiting');
		}
	}
}

global.UpgradingCartQuest = UpgradingCartQuest;
