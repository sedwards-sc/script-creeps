/* jshint esversion: 6 */
/*
 * prototype.structure
 */

Structure.prototype.descriptionString = function() {
	return this.structureType + '(' + this.pos.roomName + ', id#' + this.id + ')';
};

Structure.prototype.log = function(msg) {
	return console.log('structure: ' + this.descriptionString + ', msg: ' + msg);
};
