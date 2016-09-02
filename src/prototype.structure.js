/* jshint esversion: 6 */
/*
 * prototype.structure
 */

Structure.prototype.descriptionString = function() {
	return this.structureType + '(' + this.pos.roomName + ', id#' + this.id + ')';
};
