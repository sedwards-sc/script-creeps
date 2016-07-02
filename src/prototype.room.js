/* jshint esversion: 6 */
/*
 * prototype.room
 */

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

Room.prototype.countCreepFlags = function() {
	// filter for room flags
	let roomFlagRegex = new RegExp('^' + this.name + '_');
	let roomFlags = _.filter(Game.flags, (flag) => roomFlagRegex.test(flag.name) === true);

	this.memory.creepQuotas = {};

	for(let curFlagIndex in roomFlags) {
		let currentFlag = roomFlags[curFlagIndex];

		let flagRole = /_creep_(.+)_/.exec(currentFlag.name)[1];
		//console.log('--' + this.name + ' - ' + flagRole);

		//this.memory.creepQuotas = this.memory.creepQuotas || {};
		this.memory.creepQuotas[flagRole] = this.memory.creepQuotas[flagRole] || [];
		this.memory.creepQuotas[flagRole].push(currentFlag.name);
	}

	// filter for miner flags
	//let minerFlags = _.filter(roomFlags, (flag) => /_creep_miner_/.test(flag.name) === true);
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
