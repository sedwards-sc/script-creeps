/* jshint esversion: 6 */

module.exports = {
	undefToZero(x) {
		return x || 0;
	},

	isNullOrUndefined(theObject) {
	    return (theObject === undefined || theObject === null);
	}
};
