/* jshint esversion: 6 */
/*
 * prototype.room
 */

Room.prototype.toString = function(htmlLink = true) {
	if(htmlLink) {
		return `[${roomLink(this, this.name)}]`;
	}
	return `[${this.name}]`;
};

Room.prototype.findSources = function() {
	return this.find(FIND_SOURCES);
};

Room.prototype.assessThreats = function() {
	var hostiles = this.hostiles;
	if(hostiles.length > 0) {
		this.memory.hostiles = hostiles.length;
	} else {
		this.memory.hostiles = undefined;
		//if(_.keys(this.memory).length === 0) {
		//	this.memory = undefined;
		//}
	}
};

Room.prototype.countCreepRoles = function() {
	//console.log('### Counting creep roles for ' + this.name);

	// find room creeps
	let roomCreeps = _.filter(Game.creeps, (creep) => creep.memory.spawnRoom === this.name);

	this.memory.creepRoster = {};

	for(let curCreepIndex in roomCreeps) {
		let currentCreepRole = roomCreeps[curCreepIndex].memory.role;

        if((currentCreepRole === 'miner') && (roomCreeps[curCreepIndex].ticksToLive <= 40)) {
            continue;
        }

		if(this.controller.level === 8) {
			if((currentCreepRole === 'linker') && (roomCreeps[curCreepIndex].ticksToLive <= 35)) {
	            continue;
	        }
		}

        if((currentCreepRole === 'linker') && (roomCreeps[curCreepIndex].ticksToLive <= 20)) {
            continue;
        }

		if(this.name === 'E8S23') {
			if((currentCreepRole === 'builder') && (roomCreeps[curCreepIndex].ticksToLive <= 140)) {
	            continue;
	        }
		}

		if((currentCreepRole === 'builder') && (roomCreeps[curCreepIndex].ticksToLive <= 42)) {
            continue;
        }

		if((currentCreepRole === 'remoteMiner') && (roomCreeps[curCreepIndex].ticksToLive <= 55)) {
            continue;
        }

		if((currentCreepRole === 'remoteCarrier') && (roomCreeps[curCreepIndex].ticksToLive <= 55)) {
            continue;
        }

		this.memory.creepRoster[currentCreepRole] = this.memory.creepRoster[currentCreepRole] || 0;
		this.memory.creepRoster[currentCreepRole]++;
	}
};

Room.prototype.countCreepFlags = function() {
	Logger.log(`# Counting creep flags for ${this}`, 1);

	// filter for room flags
	let roomFlagRegex = new RegExp('^' + this.name + '_');
	let roomFlags = _.filter(Game.flags, (flag) => roomFlagRegex.test(flag.name) === true);

	this.memory.creepQuotas = {};

	for(let curFlagIndex in roomFlags) {
		let currentFlag = roomFlags[curFlagIndex];

		let flagRoleReturn = /_creep_(.+)_/.exec(currentFlag.name);

		if(flagRoleReturn === null) {
			continue;
		}

		if(currentFlag.memory.dontSpawn === true) {
			continue;
		}

		let flagRole = flagRoleReturn[1];
		this.memory.creepQuotas[flagRole] = this.memory.creepQuotas[flagRole] || [];
		this.memory.creepQuotas[flagRole].push(currentFlag.name);
	}
};

Room.prototype.planRoom = function() {
	if(this.memory.planned) {
		return OK;
	}

	this.memory.planned = true;
	console.log('#-Room ' + this.name + ' planned');
	return OK;
};

Room.prototype.isMine = function() {
    if(isNullOrUndefined(this)) {
        return false;
    }
    if(isNullOrUndefined(this.controller)) {
        return false;
    }
    return this.controller.my;
};

// this assumes vision in the reserved room
Room.prototype.isMyReserved = function() {
	if(isNullOrUndefined(this) || isNullOrUndefined(this.controller) || isNullOrUndefined(this.controller.reservation)) {
        return false;
    }
    return this.controller.reservation.username === USERNAME;
};

Room.prototype.isMineOrMyReserved = function() {
	return (this.isMine() || this.isMyReserved());
};

Room.prototype.registerLabs = function() {
	Logger.log(`Registering labs for ${this}`, 3);

	let labFlagRegex = new RegExp('^' + this.name + '_structure_lab_');
	let labFlags = _.filter(Game.flags, (flag) => labFlagRegex.test(flag.name) === true);

	for(let i in labFlags) {
		let labFlag = labFlags[i];

		let flagReturn = /_structure_lab_(\d)/.exec(labFlag.name);

		if(flagReturn === null) {
			Logger.errorLog('lab flag with invalid number: ' + labFlag.name, ERR_INVALID_TARGET, 5);
			continue;
		}

		let flagLabNum = parseInt(flagReturn[1], 10);

		if(isNaN(flagLabNum)) {
			Logger.errorLog('lab flag with NaN: ' + labFlag.name, ERR_INVALID_TARGET, 5);
			continue;
		}

		let structuresAtFlag = this.lookForAt(LOOK_STRUCTURES, labFlag.pos);

		let lab = getLab(structuresAtFlag);

		if(!lab) {
			Logger.errorLog('lab flag with no lab: ' + labFlag.name, ERR_NOT_FOUND, 5);
			continue;
		}

		this.memory.labIds = this.memory.labIds || [];
		this.memory.labIds[flagLabNum] = lab.id;
	}

	return OK;
};

Room.prototype.runLabs = function() {
	if(!isArrayWithContents(this.memory.labIds)) {
		return ERR_NOT_FOUND;
	}

	let outLabIndex = Game.time % 10;

	if(outLabIndex === 2 || outLabIndex === 7) {
		// skip ticks for inLabs indices
		return OK;
	}

	let inLabA = Game.getObjectById(this.memory.labIds[2]);
	let inLabB = Game.getObjectById(this.memory.labIds[7]);

	if(inLabA === null || inLabB === null) {
		Logger.errorLog('labIds is defined but cannot find inLabs', ERR_NOT_FOUND, 4);
		return ERR_NOT_FOUND;
	}

	if(inLabA.mineralAmount === 0 || inLabB.mineralAmount === 0) {
		// one or more inLabs are empty
		return OK;
	}

	let outLab = Game.getObjectById(this.memory.labIds[outLabIndex]);

	if(outLab === null) {
		// not necessarily a problem
		// not all labs built
		return ERR_NOT_FOUND;
	}

	return outLab.runReaction(inLabA, inLabB);
};

function getLab(structuresArray) {
	for(let i in structuresArray) {
		if(structuresArray[i].structureType === STRUCTURE_LAB) {
			return structuresArray[i];
		}
	}
}

Room.prototype.runCompoundProductionManagment = function() {
    Logger.log(`~Running compound production management for ${this}`, 0);

    // filter for room mineral transfer and return flags
	let roomMineralFlagRegex = new RegExp('^' + this.name + '_mineral(?:Transfer|Return)_');
	let roomMineralFlags = _.filter(Game.flags, (flag) => roomMineralFlagRegex.test(flag.name) === true);

	if(isArrayWithContents(roomMineralFlags)) {
	    // transfer or return phase occuring
	    return OK;
	}

	if(!isArrayWithContents(this.memory.labIds)) {
	    Logger.errorLog('compound production activated but labs are not registered', ERR_NOT_FOUND, 3);
		return ERR_NOT_FOUND;
	}

	if(typeof this.memory.labIds[2] === 'undefined' || typeof this.memory.labIds[7] === 'undefined') {
	    Logger.errorLog('inLabs are not registered, cannot run compound production', ERR_NOT_FOUND, 3);
	    return ERR_NOT_FOUND;
	}

	let labs = this.find(FIND_MY_STRUCTURES, {
	    filter: (structure) => {
	        return structure.structureType === STRUCTURE_LAB;
	    }
	});

	let inLabsEmpty = true;
	let outLabsEmpty = true;

	for(let i in labs) {
	    if(labs[i].mineralAmount > 0) {
	        if(labs[i].id === this.memory.labIds[2] || labs[i].id === this.memory.labIds[7]) {
	            inLabsEmpty = false;
	        } else {
	            outLabsEmpty = false;
	        }
	    }
	}

	if(inLabsEmpty === true && outLabsEmpty === false) {
	    Logger.log(`~Clearing finished reaction run in ${this}`, 2);
	    // add mineral return all flag
	    let flagPos = new RoomPosition(2, 2, this.name);
	    flagPos.createFlag(this.name + '_mineralReturn_all', COLOR_BLUE, COLOR_BLUE);
	} else if(inLabsEmpty === true && outLabsEmpty === true) {
	    // add reactant flags to inLabs (choose and run reaction)

	    if(typeof this.terminal === 'undefined') {
	        Logger.errorLog('no terminal in this room, cannot manage compound production', ERR_NOT_FOUND, 3);
	        return ERR_NOT_FOUND;
	    }

	    // choose reaction
	    for(let reactantA in REACTIONS) {
	       for(let reactantB in REACTIONS[reactantA]) {
	           let compound = REACTIONS[reactantA][reactantB];

			   let compoundAmount = undefToZero(this.terminal.store[compound]);

			   if(Game.creeps[this.name + '_mineralCarrier']) {
				   compoundAmount += undefToZero(Game.creeps[this.name + '_mineralCarrier'].carry[compound]);
			   }

			   let quotaAmount = this.terminal.getResourceQuota(compound);

	            if((undefToZero(this.terminal.store[reactantA]) >= LAB_MINERAL_CAPACITY) &&
	                (undefToZero(this.terminal.store[reactantB]) >= LAB_MINERAL_CAPACITY) &&
	                (compoundAmount < quotaAmount)) {

					let amountMissing = quotaAmount - compoundAmount;

					let amountToProduce = Math.min(amountMissing, LAB_MINERAL_CAPACITY);

	                // run this reaction (add reactant transfer flags on inLabs)
					Logger.log(`~Starting ${compound} reaction run in ${this} - deficit: ${amountMissing}, production qty: ${amountToProduce}`, 2);

	                let inLabA = Game.getObjectById(this.memory.labIds[2]);
                	let inLabB = Game.getObjectById(this.memory.labIds[7]);

                	if(inLabA === null || inLabB === null) {
                		Logger.errorLog('labIds is defined but cannot find inLabs', ERR_NOT_FOUND, 3);
                		return ERR_NOT_FOUND;
                	}

                	let flagNameA = inLabA.pos.createFlag(this.name + '_mineralTransfer_' + reactantA, COLOR_CYAN, COLOR_BLUE);
                	let flagNameB = inLabB.pos.createFlag(this.name + '_mineralTransfer_' + reactantB, COLOR_CYAN, COLOR_GREEN);

					Memory.flags[flagNameA] = {minerals: amountToProduce};
					Memory.flags[flagNameB] = {minerals: amountToProduce};

                	return OK;
	            }
	        }
	    }

		Logger.log(`~No valid compound orders for ${this}`, 0);

		// lay out boost compound flags
		if(typeof this.memory.boostTier !== 'undefined' && labs.length === 10) {
			let boostCompounds = getTierCompounds(this.memory.boostTier);
			if(!isArrayWithContents(boostCompounds)) {
				return ERR_INVALID_ARGS;
			}

			Logger.log(`~Laying out boost compounds in ${this}`, 2);

			for(let i in labs) {
				let secondaryColour = parseInt(i || 10);
				labs[i].pos.createFlag(this.name + '_mineralTransfer_' + boostCompounds[i], COLOR_GREEN, secondaryColour);
			}
		}
	} else if(inLabsEmpty === false && outLabsEmpty === false) {
		// then a reaction is running, could be stuck, or is currently boosting

		// check if boosting
		let validBoostState = false;
		if(typeof this.memory.boostTier !== 'undefined' && labs.length === 10) {
			validBoostState = true;
			let boostCompounds = getTierCompounds(this.memory.boostTier);
			if(!isArrayWithContents(boostCompounds)) {
				Logger.errorLog(`problem retrieving boost compounds tier list: ${this.memory.boostTier}, ${this}`, ERR_INVALID_ARGS, 4);
				return ERR_INVALID_ARGS;
			}

			for(let i in labs) {
				if(labs[i].mineralType !== boostCompounds[i] || undefToZero(labs[i].mineralAmount) < 30) {
					validBoostState = false;
				}
			}
		}

		let outLab0 = Game.getObjectById(this.memory.labIds[0]);
		let inLabA = Game.getObjectById(this.memory.labIds[2]);
		let inLabB = Game.getObjectById(this.memory.labIds[7]);

		if(outLab0 === null || inLabA === null || inLabB === null) {
			Logger.errorLog(`cannot find inLabs and outLab0 for checking reaction progress in ${this}`, ERR_NOT_FOUND, 3);
			return ERR_NOT_FOUND;
		}

		let reactantA = inLabA.mineralType;
		let reactantB = inLabB.mineralType;
		let compound = outLab0.mineralType;

		if((typeof REACTIONS[reactantA] === 'undefined' || typeof REACTIONS[reactantA][reactantB] === 'undefined' || REACTIONS[reactantA][reactantB] !== compound) && !validBoostState) {
			Logger.errorLog(`problem with reaction run in ${this}`, ERR_INVALID_ARGS, 4);
		    // add mineral return all flag
		    let flagPos = new RoomPosition(2, 2, this.name);
		    flagPos.createFlag(this.name + '_mineralReturn_all', COLOR_BLUE, COLOR_BLUE);
		}

		// else reaction is running fine
	}

	// else if inLabsEmpty === false && outLabsEmpty === true then the second inLab just got filled and the first reaction hasn't occured yet (or stuck if it keeps happening)
	return OK;
};

Room.prototype.mineralReport = function() {
	let mineral = this.find(FIND_MINERALS)[0];
	if(!mineral) {
		Logger.errorLog(`could not find room mineral in ${this}`, ERR_NOT_FOUND, 4);
		return ERR_NOT_FOUND;
	}

	let reportString = "";
	reportString += "Room Mineral Report";
	reportString += "\nRoom: " + this.name;
	reportString += "\nType: " + mineral.mineralType;
	reportString += "\nAmount: " + mineral.mineralAmount;
	reportString += "\nDensity: " + mineral.density;
	reportString += "\nTicks to Regeneration: " + mineral.ticksToRegeneration;

	if(this.storage) {
		reportString += "\nStorage Amount: " + undefToZero(this.storage.store[mineral.mineralType]);
		let shouldMine = "no";
		if(undefToZero(this.storage.store[mineral.mineralType]) < 150000) {
			shouldMine = "yes";
		}
		reportString += "\nShould mine?: " + shouldMine;
	}

	Logger.log(reportString, 3);
};

Room.prototype.checkMineralStatus = function() {
	if(typeof this.memory.shouldMine === 'undefined') {
		this.memory.shouldMine = false;
	}

	let mineral = this.find(FIND_MINERALS)[0];
	if(!mineral) {
		Logger.errorLog(`could not find room mineral in ${this}`, ERR_NOT_FOUND, 4);
		return ERR_NOT_FOUND;
	}

	let retStructs = this.lookForAt(LOOK_STRUCTURES, mineral.pos);
	let extractor = getStructure(retStructs, STRUCTURE_EXTRACTOR);
	if(!extractor) {
		this.memory.shouldMine = false;
		return OK;
	}

	if(mineral.mineralAmount === 0 || (this.storage && undefToZero(this.storage.store[mineral.mineralType]) > 300000)) {
		this.memory.shouldMine = false;
	} else if(mineral.mineralAmount > 0 && this.storage && undefToZero(this.storage.store[mineral.mineralType]) < 150000) {
		this.memory.shouldMine = true;
	}

	return OK;
};

/**
 * Returns array of structures, caching results on a per-tick basis
 * @param structureType
 * @returns {Structure[]}
 */
Room.prototype.findStructures = function(structureType) {
    if(!Game.cache.structures[this.name]) {
        Game.cache.structures[this.name] = _.groupBy(this.find(FIND_STRUCTURES), (s) => s.structureType);
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

Room.prototype.drawRoomStats = function() {
	if(this.storage) {
		this.visual.text(`Storage Energy Amount: ${undefToZero(this.storage.store.energy)}`, 0, 1, { 'align': 'left', 'opacity': 0.5 });
		this.visual.text(`Storage Power Amount: ${undefToZero(this.storage.store.power)}`, 0, 2, { 'align': 'left', 'opacity': 0.5 });
		this.visual.text(`Storage Overall Resource Amount: ${_.sum(this.storage.store)}`, 0, 3, { 'align': 'left', 'opacity': 0.5 });
	}

	if(this.terminal) {
		this.visual.text(`Terminal Energy Amount: ${undefToZero(this.terminal.store.energy)}`, 0, 5, { 'align': 'left', 'opacity': 0.5 });
		this.visual.text(`Terminal Power Amount: ${undefToZero(this.terminal.store.power)}`, 0, 6, { 'align': 'left', 'opacity': 0.5 });
		this.visual.text(`Terminal Overall Resource Amount: ${_.sum(this.terminal.store)}`, 0, 7, { 'align': 'left', 'opacity': 0.5 });
	}
};
