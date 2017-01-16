/* jshint esversion: 6 */
/*
 * prototype.structure
 */

Structure.prototype.descriptionString = function() {
	return `${this.structureType} (${this.pos.roomName}, id#${this.id})`;
};

Structure.prototype.log = function(msg, severity = 2) {
	return Logger.log(`structure: ${this.descriptionString()}, msg: ${msg}`, severity);
};

Structure.prototype.errorLog = function(msg, errCode = -10, severity = 3) {
	return Logger.log(`!!!Error!!! structure: ${this.descriptionString()}, msg: ${msg} (${errorCodeToText(errCode)})`, severity);
};
