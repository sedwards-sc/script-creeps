/* jshint esversion: 6 */

const STORAGE_MINIMUM = 200000;

class LinkingQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('linking', PRIORITY_LOW, id, flag, colony);
	}

	initQuest() {
		this.storage = this.flag.room.storage;
		this.links = this.flag.room.findStructures(STRUCTURE_LINK);

		if(this.storage && this.links.length >= 2) {
			this.requiredStructures = true;

			if(this.memory.cache.storageLinkId) {
				let storageLink = Game.structures[this.memory.cache.storageLinkId];
				if(storageLink) {
					this.storageLink = storageLink;
				} else {
					delete this.memory.cache.storageLinkId;
				}
			} else {
				let storageLink = _.first(_.sortBy(this.links, link => link.pos.getRangeTo(this.storage)));
				if(storageLink) {
					this.memory.cache.storageLinkId = storageLink.id;
					this.storageLink = storageLink;
				}
			}

			if(this.memory.cache.controllerLinkId) {
				let controllerLink = Game.structures[this.memory.cache.controllerLinkId];
				if(controllerLink) {
					this.controllerLink = controllerLink;
				} else {
					delete this.memory.cache.controllerLinkId;
				}
			} else {
				let controllerLink = _.first(_.sortBy(this.links, link => link.pos.getRangeTo(this.flag.room.controller)));
				if(controllerLink) {
					this.memory.cache.controllerLinkId = controllerLink.id;
					this.controllerLink = controllerLink;
				}
			}
		}

		this.linkers = [];
	}

	runCensus() {
		let maxLinkers = 0;
		if(this.requiredStructures) {
			maxLinkers = 1;
		}
		// TODO: calculate prespawn based on distance from spawn to flag
		this.linkers = this.attendance("linker_" + this.id, [MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY], maxLinkers, {prespawn: 2});
	}

	runActivities() {
		this.linkers.forEach(creep => this.linkerActions(creep));

		if(this.requiredStructures) {
			this.runLinks();
		}
	}

	questEnd() {
	}

	linkerActions(creep) {
		if(!this.requiredStructures) {
			creep.say("missing");
			return;
		}

		if(creep.ticksToLive <= 1) {
			creep.transfer(this.storage, RESOURCE_ENERGY);
			return;
		}

		if(creep.pos.isEqualTo(this.flag)) {
			creep.memory.avoidMe = true;

			if(creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
				if(this.storageLink && this.storageLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
					creep.transfer(this.storageLink, RESOURCE_ENERGY);
				} else {
					creep.transfer(this.storage, RESOURCE_ENERGY);
				}
			} else {
				let excessEnergy = this.storage.store.getUsedCapacity(RESOURCE_ENERGY) > STORAGE_MINIMUM;
				if(excessEnergy && this.storageLink && this.storageLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
					creep.withdraw(this.storage, RESOURCE_ENERGY);
				}
			}
		} else {
			creep.blindMoveTo(this.flag);
		}
	}

	runLinks() {
		if(!this.storageLink || !this.controllerLink || this.storageLink.id === this.controllerLink.id) {
			return;
		}

		let loaded = this.storageLink.store.getUsedCapacity(RESOURCE_ENERGY) >= this.storageLink.store.getCapacity(RESOURCE_ENERGY) * 0.75;
		let hasSpace = this.controllerLink.store.getFreeCapacity(RESOURCE_ENERGY) >= this.controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.75;
		if(loaded && hasSpace && this.storageLink.cooldown === 0) {
			this.storageLink.transferEnergy(this.controllerLink);
		}

		if(this.controllerLink.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
			_.filter(
				this.flag.room.findMyCreeps(),
				creep => creep.pos.isNearTo(this.controllerLink) && _.filter(creep.body, part => part.type === WORK).length > 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) >= 50
			).forEach(
				creep => creep.withdraw(this.controllerLink, RESOURCE_ENERGY)
			);
		}
	}
}

global.LinkingQuest = LinkingQuest;