/* jshint esversion: 6 */
/*
 * prototype.link
 */

Flag.prototype.isRemoteFlag = function() {
	return this.name.indexOf('_remote_') >= 0;
};
