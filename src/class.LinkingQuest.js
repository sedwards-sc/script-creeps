/* jshint esversion: 6 */

const STORAGE_MINIMUM = 200000;
const TERMINAL_MINIMUM = 50000;

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
				let storageLink = _.first(_.filter(this.links, link => link.pos.getRangeTo(this.storage) <= 2));
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
				let controllerLink = _.first(_.filter(this.links, link => link.pos.getRangeTo(this.flag.room.controller) <= 2));
				if(controllerLink) {
					this.memory.cache.controllerLinkId = controllerLink.id;
					this.controllerLink = controllerLink;
				}
			}

			this.sourceLinks = [];
			if(_.isArray(this.memory.cache.sourceLinkIds)) {
				if(this.memory.cache.sourceLinkIds.length > 0) {
					this.memory.cache.sourceLinkIds.forEach(
						linkId => {
							let link = Game.structures[linkId];
							if(link) {
								this.sourceLinks.push(link);
							}
						}
					);
				}
			} else {
				this.memory.cache.sourceLinkIds = [];

				let potentialSourceLinks = _.filter(
					this.links,
					link => {
						if(this.storageLink && link.id === this.storageLink.id) {
							return false;
						}
						if(this.controllerLink && link.id === this.controllerLink.id) {
							return false;
						}
						return true;
					}
				);

				potentialSourceLinks.forEach(
					link => {
						let linkSource = _.first(_.filter(this.flag.room.sources, source => source.pos.getRangeTo(link) <= 2));
						if(linkSource) {
							this.memory.cache.sourceLinkIds.push(link.id);
							this.sourceLinks.push(link);
						}
					}
				);
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
		this.linkers = this.attendance("linker_" + this.id, [MOVE, CARRY, CARRY, CARRY, CARRY], maxLinkers, {prespawn: 2});
	}

	runActivities() {
		this.linkers.forEach(
			creep => {
				if(this.controllerLink) {
					this.linkerActionsUpgrade(creep);
				} else {
					this.linkerActionsIncome(creep);
				}
			}
		);

		if(this.requiredStructures) {
			if(this.controllerLink) {
				this.runLinksUpgrade();
			} else {
				this.runLinksIncome();
			}
		}
	}

	questEnd() {
	}

	linkerActionsUpgrade(creep) {
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

			let roomTerminal = this.flag.room.terminal;
			if(creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
				if(this.storageLink && this.storageLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
					creep.transfer(this.storageLink, RESOURCE_ENERGY);
				} else if(roomTerminal && roomTerminal.store.getUsedCapacity(RESOURCE_ENERGY) < TERMINAL_MINIMUM) {
					creep.transfer(roomTerminal, RESOURCE_ENERGY);
				} else {
					creep.transfer(this.storage, RESOURCE_ENERGY);
				}
			} else {
				let excessEnergy = this.storage.store.getUsedCapacity(RESOURCE_ENERGY) > STORAGE_MINIMUM;
				let storageLinkSpace = this.storageLink && this.storageLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
				let terminalNeedsFilling = roomTerminal && roomTerminal.store.getUsedCapacity(RESOURCE_ENERGY) < TERMINAL_MINIMUM;
				if(excessEnergy && (storageLinkSpace || terminalNeedsFilling)) {
					creep.withdraw(this.storage, RESOURCE_ENERGY);
				}
			}
		} else {
			creep.blindMoveTo(this.flag);
		}
	}

	linkerActionsIncome(creep) {
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

			let roomTerminal = this.flag.room.terminal;
			if(creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
				if(roomTerminal && roomTerminal.store.getUsedCapacity(RESOURCE_ENERGY) < TERMINAL_MINIMUM && this.storage.store.getUsedCapacity(RESOURCE_ENERGY) > STORAGE_MINIMUM) {
					creep.transfer(roomTerminal, RESOURCE_ENERGY);
				} else if(this.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
					creep.transfer(this.storage, RESOURCE_ENERGY);
				}
			} else {
				if(this.storageLink && this.storageLink.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
					creep.withdraw(this.storageLink, RESOURCE_ENERGY);
				} else if(roomTerminal && roomTerminal.store.getUsedCapacity(RESOURCE_ENERGY) > TERMINAL_MINIMUM) {
					let energy = Math.min(roomTerminal.store.getUsedCapacity(RESOURCE_ENERGY) - TERMINAL_MINIMUM, creep.store.getFreeCapacity(RESOURCE_ENERGY));
					creep.withdraw(roomTerminal, RESOURCE_ENERGY, energy);
				} else if(roomTerminal && roomTerminal.store.getUsedCapacity(RESOURCE_ENERGY) < TERMINAL_MINIMUM && this.storage.store.getUsedCapacity(RESOURCE_ENERGY) > STORAGE_MINIMUM) {
					let energy = Math.min(TERMINAL_MINIMUM - roomTerminal.store.getUsedCapacity(RESOURCE_ENERGY), creep.store.getFreeCapacity(RESOURCE_ENERGY));
					creep.withdraw(this.storage, RESOURCE_ENERGY, energy);
				}
			}
		} else {
			creep.blindMoveTo(this.flag);
		}
	}

	runLinksUpgrade() {
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
				creep => creep.pos.isNearTo(this.controllerLink) &&
					_.filter(creep.body, part => part.type === WORK).length > 0 &&
					creep.store.getFreeCapacity(RESOURCE_ENERGY) >= 50 &&
					creep.ticksToLive > 30
			).forEach(
				creep => creep.withdraw(this.controllerLink, RESOURCE_ENERGY)
			);
		}
	}

	runLinksIncome() {
		if(!this.storageLink) {
			return;
		}

		this.sourceLinks.forEach(
			link => {
				let loaded = link.store.getUsedCapacity(RESOURCE_ENERGY) >= link.store.getCapacity(RESOURCE_ENERGY) * 0.75;
				let hasSpace = this.storageLink.store.getFreeCapacity(RESOURCE_ENERGY) >= this.storageLink.store.getCapacity(RESOURCE_ENERGY) * 0.75;
				if(loaded && hasSpace && link.cooldown === 0) {
					link.transferEnergy(this.storageLink);
				}
			}
		);
	}
}

global.LinkingQuest = LinkingQuest;
