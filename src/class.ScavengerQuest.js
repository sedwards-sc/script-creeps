/* jshint esversion: 6 */

const REMEMBER_RESOURCE_KEY = "remResId";

class ScavengerQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('scavenger', PRIORITY_TRIVIAL, id, flag, colony);
	}

	initQuest() {
		this.scavengers = [];
	}

	runCensus() {
		// TODO: only spawn if there are resources to scavenge
		let maxScavengers = 0;
		if(this.flag.room.storage && this.flag.room.storage.store.getFreeCapacity() > 5000) {
			maxScavengers = 1;
		}
		this.scavengers = this.attendance(this.nameId, this.spawnGroup.workerBodyRatio(0, 1, 1, 1, 4), maxScavengers);
	}

	runActivities() {
		for(let creep of this.scavengers) {
			if(!creep.spawning) {
				this.scavengerActions(creep)
			}
		}
	}

	questEnd() {
	}

	scavengerActions(creep) {
		if(creep.fleeHostiles()) {
			return;
		}

		let withinRoom = creep.pos.roomName === this.flag.pos.roomName;
		if(!withinRoom) {
			creep.blindMoveTo(this.flag);
			return;
		}

		if(creep.store.getUsedCapacity() > 0) {
			let storage = creep.room.storage;
			if(!storage) {
				creep.say("no storage");
				creep.idleOffRoad(this.flag);
				return;
			}

			if(creep.pos.isNearTo(storage)) {
				creep.transferEverything(storage);
			} else {
				creep.blindMoveTo(storage);
			}

			return;
		}

		let findResource = () => {
			let resourceSources = [];
			resourceSources = resourceSources.concat(
				// TODO: ignore piles under drop miners specifically
				_.filter(creep.room.findDroppedResources(), (r) => r.amount > 20 && r.pos.lookFor(LOOK_CREEPS).length === 0)
			);
			resourceSources = resourceSources.concat(
				_.filter(creep.room.findTombstones(), (t) => t.store.getUsedCapacity() > 0)
			);
			resourceSources = resourceSources.concat(
				_.filter(creep.room.findRuins(), (r) => r.store.getUsedCapacity() > 0)
			);
			if(resourceSources.length > 0) {
				return creep.pos.findClosestByPath(resourceSources);
			}
		};
		let forgetResource = (e) => {
			if(e instanceof Resource) {
				if(e.amount > 20) {
					return false;
				}
			} else if(e.store && e.store.getUsedCapacity() > 0) {
				return false;
			}
			return true;
		};
		let resourceSource = creep.rememberStructure(findResource, forgetResource, REMEMBER_RESOURCE_KEY);

		if(resourceSource) {
			if(creep.pos.isNearTo(resourceSource)) {
				let ret;
				if(resourceSource instanceof Resource) {
					ret = creep.pickup(resourceSource);
				} else {
					ret = creep.withdrawEverything(resourceSource);
				}
				if(ret !== OK) {
					delete creep.memory[REMEMBER_RESOURCE_KEY];
				}
			} else {
				creep.blindMoveTo(resourceSource);
			}
		} else {
			if(creep.pos.inRangeTo(this.flag, 3)) {
				creep.say('idle');
				creep.yieldRoad(this.flag);
			} else {
				creep.blindMoveTo(this.flag);
			}
		}
	}
}

global.ScavengerQuest = ScavengerQuest;
