/* jshint esversion: 6 */
/*
 * prototype.link
 */

Flag.prototype.isRemoteFlag = function() {
	return this.name.indexOf('_remote_') >= 0;
};

Flag.prototype.isCreepFlag = function() {
	return this.name.indexOf('_creep_') >= 0;
};
