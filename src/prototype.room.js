/* jshint esversion: 6 */
/*
 * prototype.room
 */

Room.prototype.findSources = function() {
	return this.find(FIND_SOURCES);
};

Room.prototype.assessThreats = function() {
	var hostiles = this.find(FIND_HOSTILE_CREEPS);
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

        if((currentCreepRole === 'miner') && (roomCreeps[curCreepIndex].ticksToLive <= 36)) {
            continue;
        }

        if((currentCreepRole === 'linker') && (roomCreeps[curCreepIndex].ticksToLive <= 12)) {
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
	console.log('### Counting creep flags for ' + this.name);

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

Room.prototype.registerLabs = function() {
	console.log('Registering labs for room ' + this.name);

	let labFlagRegex = new RegExp('^' + this.name + '_structure_lab_');
	let labFlags = _.filter(Game.flags, (flag) => labFlagRegex.test(flag.name) === true);

	for(let i in labFlags) {
		let labFlag = labFlags[i];

		let flagReturn = /_structure_lab_(\d)/.exec(labFlag.name);

		if(flagReturn === null) {
			let errString = '!!!!ERROR: lab flag with invalid number: ' + labFlag.name;
			console.log(errString);
			Game.notify(errString);
			continue;
		}

		let flagLabNum = parseInt(flagReturn[1], 10);

		if(isNaN(flagLabNum)) {
			let errString = '!!!!ERROR: lab flag with NaN: ' + labFlag.name;
			console.log(errString);
			Game.notify(errString);
			continue;
		}

		let structuresAtFlag = this.lookForAt(LOOK_STRUCTURES, labFlag.pos);

		let lab = getLab(structuresAtFlag);

		if(!lab) {
			let errString = '!!!!ERROR: lab flag with no lab: ' + labFlag.name;
			console.log(errString);
			Game.notify(errString);
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
		console.log('!!!!ERROR: labIds is defined but cannot find inLabs');
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
    //console.log('~Running compound production management for room ' + this.name);

    // filter for room mineral transfer and return flags
	let roomMineralFlagRegex = new RegExp('^' + this.name + '_mineral(?:Transfer|Return)_');
	let roomMineralFlags = _.filter(Game.flags, (flag) => roomMineralFlagRegex.test(flag.name) === true);

	if(isArrayWithContents(roomMineralFlags)) {
	    // transfer or return phase occuring
	    return OK;
	}

	if(!isArrayWithContents(this.memory.labIds)) {
	    console.log('!!!!ERROR: compound production activated but labs are not registered');
		return ERR_NOT_FOUND;
	}

	if(typeof this.memory.labIds[2] === 'undefined' || typeof this.memory.labIds[7] === 'undefined') {
	    console.log('!!!ERROR: inLabs are not registered, cannot run compound production');
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
	    console.log('Clearing finished reaction run in room ' + this.name);
	    // add mineral return all flag
	    let flagPos = new RoomPosition(2, 2, this.name);
	    flagPos.createFlag(this.name + '_mineralReturn_all', COLOR_BLUE, COLOR_BLUE);
	} else if(inLabsEmpty === true && outLabsEmpty === true) {
	    // add reactant flags to inLabs (choose and run reaction)

	    if(typeof this.terminal === 'undefined') {
	        console.log('!!!ERROR: no terminal in this room, cannot manage compound production');
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
	                console.log('Starting ' + compound + ' reaction run in room ' + this.name + ' - deficit: ' + amountMissing + ', production qty: ' + amountToProduce);

	                let inLabA = Game.getObjectById(this.memory.labIds[2]);
                	let inLabB = Game.getObjectById(this.memory.labIds[7]);

                	if(inLabA === null || inLabB === null) {
                		console.log('!!!!ERROR: labIds is defined but cannot find inLabs');
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
		//console.log('no compounds under quota for room ' + this.name);

		// lay out boost compound flags
		if(typeof this.memory.boostTier !== 'undefined' && labs.length === 10) {
			let boostCompounds = getTierCompounds(this.memory.boostTier);
			if(!isArrayWithContents(boostCompounds)) {
				return ERR_INVALID_ARGS;
			}

			console.log('Laying out boost compounds in room ' + this.name);

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
			console.log('!!!!ERROR: Cannot find inLabs and outLab0 for checking reaction progress');
			return ERR_NOT_FOUND;
		}

		let reactantA = inLabA.mineralType;
		let reactantB = inLabB.mineralType;
		let compound = outLab0.mineralType;

		if((typeof REACTIONS[reactantA] === 'undefined' || typeof REACTIONS[reactantA][reactantB] === 'undefined' || REACTIONS[reactantA][reactantB] !== compound) && !validBoostState) {
			console.log('!!!!ERROR: Problem with reaction run in room ' + this.name);
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
		console.log('!!!!Error: could not find room mineral');
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

	console.log(reportString);
};

Room.prototype.checkMineralStatus = function() {
	if(typeof this.memory.shouldMine === 'undefined') {
		this.memory.shouldMine = false;
	}

	let mineral = this.find(FIND_MINERALS)[0];
	if(!mineral) {
		console.log('!!!!Error: could not find room mineral - ' + this.name);
		return ERR_NOT_FOUND;
	}

	let retStructs = this.lookForAt(LOOK_STRUCTURES, mineral.pos);
	let extractor = getStructure(retStructs, STRUCTURE_EXTRACTOR);
	if(typeof extractor === 'undefined') {
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

// DEPRECATED - added to global utils
//function isNullOrUndefined(theObject) {
//    return (theObject === undefined || theObject === null);
//}
