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

// DEPRECATED - added to global utils
//function isNullOrUndefined(theObject) {
//    return (theObject === undefined || theObject === null);
//}
