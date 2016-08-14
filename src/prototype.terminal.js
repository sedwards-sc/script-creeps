/* jshint esversion: 6 */
/*
 * prototype.terminal
 */

StructureTerminal.prototype.getResourceQuota = function(resourceType) {
	if(resourceType === RESOURCE_ENERGY) {
		return 25000;
	}
	return 5000;
};
