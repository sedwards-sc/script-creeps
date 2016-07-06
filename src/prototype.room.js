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

function isNullOrUndefined(theObject) {
    return (theObject === undefined || theObject === null);
}
