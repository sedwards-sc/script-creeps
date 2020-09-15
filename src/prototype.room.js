/* jshint esversion: 6 */
/*
 * prototype.room
 */

// Room.prototype.toString = function(htmlLink = true) {
// 	if(htmlLink) {
// 		return `[${roomLink(this, this.name)}]`;
// 	}
// 	return `[${this.name}]`;
// };

/**
 * Returns array of structures, caching results on a per-tick basis
 * @returns {Structure[]}
 */
Room.prototype.findAllStructures = function() {
	if(!this.cache) {
		this.cache = {};
	}
	if(!this.cache.structures) {
		this.cache.structures = this.find(FIND_STRUCTURES);
	}
	return this.cache.structures || [];
};

/**
 * Returns array of structures (specified by type), caching results on a per-tick basis
 * @param structureType
 * @returns {Structure[]}
 */
Room.prototype.findStructures = function(structureType) {
	if(!Game.cache.structures[this.name]) {
		Game.cache.structures[this.name] = _.groupBy(this.findAllStructures(), (s) => s.structureType);
	}
	return Game.cache.structures[this.name][structureType] || [];
};

/**
 * Returns array of creeps, caching results on a per-tick basis
 * @returns {Creep[]}
 */
Room.prototype.findCreeps = function() {
	if(!Game.cache.creeps[this.name]) {
		Game.cache.creeps[this.name] = this.find(FIND_CREEPS);
	}
	return Game.cache.creeps[this.name] || [];
};

/**
 * Returns array of my creeps, caching results on a per-tick basis
 * @returns {Creep[]}
 */
Room.prototype.findMyCreeps = function() {
	if(!this.cache) {
		this.cache = {};
	}
	if(!this.cache.myCreeps) {
		this.cache.myCreeps = _.filter(this.findCreeps(), (creep) => creep.my);
	}
	return this.cache.myCreeps;
};

/**
 * Returns array of construction sites, caching results on a per-tick basis
 * @returns {ConstructionSite[]}
 */
Room.prototype.findConstructionSites = function() {
	if(!this.cache) {
		this.cache = {};
	}
	if(!this.cache.constructionSites) {
		this.cache.constructionSites = this.find(FIND_CONSTRUCTION_SITES);
	}
	return this.cache.constructionSites || [];
};

/**
 * Returns array of construction sites of a specified structure type, caching results on a per-tick basis
 * @param structureType
 * @returns {ConstructionSite[]}
 */
Room.prototype.findConstructionSitesByType = function(structureType) {
	if(!this.cache) {
		this.cache = {};
	}
	if(!this.cache.constructionSitesByType) {
		this.cache.constructionSitesByType = _.groupBy(this.findConstructionSites(), (s) => s.structureType);
	}
	return this.cache.constructionSitesByType[structureType] || [];
};

/**
 * Returns array of dropped resources, caching results on a per-tick basis
 * @returns {Resource[]}
 */
Room.prototype.findDroppedResources = function() {
	if(!this.cache) {
		this.cache = {};
	}
	if(!this.cache.droppedResources) {
		this.cache.droppedResources = this.find(FIND_DROPPED_RESOURCES);
	}
	return this.cache.droppedResources || [];
};

/**
 * Returns array of tombstones in the room, caching results on a per-tick basis
 * @returns {Tombstones[]}
 */
Room.prototype.findTombstones = function() {
	if(!this.cache) {
		this.cache = {};
	}
	if(!this.cache.tombstones) {
		this.cache.tombstones = this.find(FIND_TOMBSTONES);
	}
	return this.cache.tombstones || [];
};

/**
 * Returns array of ruins in the room, caching results on a per-tick basis
 * @returns {Ruins[]}
 */
Room.prototype.findRuins = function() {
	if(!this.cache) {
		this.cache = {};
	}
	if(!this.cache.ruins) {
		this.cache.ruins = this.find(FIND_RUINS);
	}
	return this.cache.ruins || [];
};

Object.defineProperty(Room.prototype, "ownedByMe", {
	get: function myProperty() {
		if(isNullOrUndefined(this)) {
			return false;
		}
		if(isNullOrUndefined(this.controller)) {
			return false;
		}
		return this.controller.my;
	}
});

// this assumes vision in the reserved room
Object.defineProperty(Room.prototype, "reservedByMe", {
	get: function myProperty() {
		if(isNullOrUndefined(this) || isNullOrUndefined(this.controller) || isNullOrUndefined(this.controller.reservation)) {
			return false;
		}
		return this.controller.reservation.username === USERNAME;
	}
});

Object.defineProperty(Room.prototype, "ownedOrReservedByMe", {
	get: function myProperty() {
		return (this.ownedByMe || this.reservedByMe);
	}
});

Object.defineProperty(Room.prototype, "sources", {
	get: function myProperty() {
		if(!this.cache) {
			this.cache = {};
		}
		if(!this.cache.sources) {
			this.cache.sources = this.find(FIND_SOURCES);
		}
		return this.cache.sources;
	}
});

Object.defineProperty(Room.prototype, "mineral", {
	get: function myProperty() {
		if(!this.cache) {
			this.cache = {};
		}
		if(!this.cache.mineral) {
			this.cache.mineral = _.head(this.find(FIND_MINERALS));
		}
		return this.cache.mineral;
	}
});

Object.defineProperty(Room.prototype, "hostiles", {
	get: function myProperty() {
		if(!Game.cache.hostiles[this.name]) {
			let hostiles = this.find(FIND_HOSTILE_CREEPS);
			let filteredHostiles = [];
			for(let hostile of hostiles) {
				let username = hostile.owner.username;
				let isEnemy = checkEnemy(username, this.name);
				if(isEnemy) {
					filteredHostiles.push(hostile);
				}
			}
			Game.cache.hostiles[this.name] = filteredHostiles;
		}
		return Game.cache.hostiles[this.name];
	}
});

Object.defineProperty(Room.prototype, "hostilesAndLairs", {
	get: function myProperty() {
		if(!Game.cache.hostilesAndLairs[this.name]) {
			let lairs = _.filter(this.findStructures(STRUCTURE_KEEPER_LAIR), (lair) => {
				return !lair.ticksToSpawn || lair.ticksToSpawn < 10;
			});
			Game.cache.hostilesAndLairs[this.name] = lairs.concat(this.hostiles);
		}
		return Game.cache.hostilesAndLairs[this.name];
	}
});

Object.defineProperty(Room.prototype, "roomType", {
	get: function myProperty() {
		if(!this.memory.roomType) {

			// source keeper
			let lairs = this.findStructures(STRUCTURE_KEEPER_LAIR);
			if(lairs.length > 0) {
				this.memory.roomType = ROOMTYPE_SOURCEKEEPER;
			}

			// core
			if(!this.memory.roomType) {
				let sources = this.find(FIND_SOURCES);
				if(sources.length === 3) {
					this.memory.roomType = ROOMTYPE_CORE;
				}
			}

			// controller rooms
			if(!this.memory.roomType) {
				if(this.controller) {
					this.memory.roomType = ROOMTYPE_CONTROLLER;
				} else {
					this.memory.roomType = ROOMTYPE_ALLEY;
				}
			}
		}
		return this.memory.roomType;
	}
});
