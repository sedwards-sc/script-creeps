/* jshint esversion: 6 */

function undefToZero(x) {
	return x || 0;
}

function isNullOrUndefined(theObject) {
    return (theObject === undefined || theObject === null);
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
	g.calculateCreepCost = calculateCreepCost;
}

exports.populateUtils = populateUtils;
