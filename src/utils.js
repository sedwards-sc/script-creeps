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

function getStructure(structuresArray, structType) {
	for(let i in structuresArray) {
		if(structuresArray[i].structureType === structType) {
			return structuresArray[i];
		}
	}
}

function getResourcesOfType(resourcesArray, resType) {
	let resourceReturnArray = [];
	for(let i in resourcesArray) {
		if(resourcesArray[i].resourceType === resType) {
			resourceReturnArray.push(resourcesArray[i]);
		}
	}
	return resourceReturnArray;
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
	g.getStructure = getStructure;
	g.getResourcesOfType = getResourcesOfType;
	g.calculateCreepCost = calculateCreepCost;
}

exports.populateUtils = populateUtils;
