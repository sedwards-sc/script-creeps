/* jshint esversion: 6 */

function undefToZero(x) {
	return x || 0;
}

function isNullOrUndefined(theObject) {
    return (theObject === undefined || theObject === null);
}

function populateUtils(g) {
    g.undefToZero = undefToZero;
    g.isNullOrUndefined = isNullOrUndefined;
}

exports.populateUtils = populateUtils;
