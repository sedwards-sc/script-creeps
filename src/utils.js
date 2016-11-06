/* jshint esversion: 6 */

function undefToZero(x) {
	return x || 0;
}

function isNullOrUndefined(theObject) {
    return (theObject === undefined || theObject === null);
}

function isArrayWithContents(arrayToCheck) {
	if((typeof arrayToCheck !== 'undefined') && (arrayToCheck !== null) && (arrayToCheck.length !== null) && (arrayToCheck.length > 0)) {
		return true;
	}
	return false;
}

function calculateCreepCost(bodyParts) {
	let cost = 0;
	bodyParts.forEach((bodyPart) => {
		const part = typeof bodyPart === 'string' ? bodyPart : bodyPart.type;
		cost += BODYPART_COST[part];
	});

	return cost;
}

function populateUtils(g) {
    g.undefToZero = undefToZero;
    g.isNullOrUndefined = isNullOrUndefined;
	g.isArrayWithContents = isArrayWithContents;
	g.calculateCreepCost = calculateCreepCost;
}

exports.populateUtils = populateUtils;
