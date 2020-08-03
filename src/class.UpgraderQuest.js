/* jshint esversion: 6 */

class UpgraderQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('upgrader', PRIORITY_LOW, id, flag, colony);
	}

	initQuest() {
		this.upgrader = [];
	}

	runCensus() {
		// TODO: prespawn using distance from spawn to controller.
		this.upgrader = this.attendance(this.nameId, this.spawnGroup.workerBodyRatio(1, 1, 2, 1), 1, {prespawn: 0});
	}

	runActivities() {
		for(let creep of this.upgrader) {
			if(!creep.spawning) {
				this.upgraderActions(creep)
			}
		}
	}

	questEnd() {
	}

	upgraderActions(creep) {
		let withinRoom = creep.pos.roomName === this.flag.pos.roomName;
		if(!withinRoom) {
			creep.moveTo(this.flag);
			return;
		}

		if(creep.hasLoad()) {
			let workTarget = this.colony.flag.room.controller;

			let findConstructionSite = () => {
				return _.first(this.colony.flag.room.find(FIND_CONSTRUCTION_SITES));
			};
			let forgetConstructionSite = (o) => {
				if(o instanceof ConstructionSite) {
					return false;
				}
				return true;
			};
			let site = creep.rememberStructure(findConstructionSite, forgetConstructionSite, "remSiteId");
			if(site) {
				workTarget = site;
			}

			if(creep.buildOrUpgrade(workTarget) === ERR_NOT_IN_RANGE) {
				creep.moveTo(workTarget);
			} else {
				creep.yieldRoad(workTarget);
			}
			return;
		}

		let findEnergy = () => {
			let energySources = [];
			if(creep.room.storage && creep.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
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
			} else if(e instanceof Structure) {
				if(e.store && e.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
					return false;
				}
			}
			return true;
		};
		let energySource = creep.rememberStructure(findEnergy, forgetEnergy, "remEnergyId", true);

		if(energySource) {
			if(creep.pos.isNearTo(energySource)) {
				creep.takeResource(energySource, RESOURCE_ENERGY);
			} else {
				creep.moveTo(energySource);
			}
		} else {
			creep.say("no energy");
			creep.idleOffRoad(this.flag);
		}
	}
}

global.UpgraderQuest = UpgraderQuest;
