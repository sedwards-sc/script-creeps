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

function getTierCompounds(tier) {
	let compounds;

	if(tier === 1) {
		compounds = [
			RESOURCE_UTRIUM_HYDRIDE,
    		RESOURCE_UTRIUM_OXIDE,
    		RESOURCE_KEANIUM_HYDRIDE,
    		RESOURCE_KEANIUM_OXIDE,
    		RESOURCE_LEMERGIUM_HYDRIDE,
    		RESOURCE_LEMERGIUM_OXID,
    		RESOURCE_ZYNTHIUM_HYDRIDE,
    		RESOURCE_ZYNTHIUM_OXIDE,
    		RESOURCE_GHODIUM_HYDRIDE,
    		RESOURCE_GHODIUM_OXIDE
		];
	} else if(tier === 2) {
		compounds = [
			RESOURCE_UTRIUM_ACID,
		    RESOURCE_UTRIUM_ALKALIDE,
		    RESOURCE_KEANIUM_ACID,
		    RESOURCE_KEANIUM_ALKALIDE,
		    RESOURCE_LEMERGIUM_ACID,
		    RESOURCE_LEMERGIUM_ALKALIDE,
		    RESOURCE_ZYNTHIUM_ACID,
		    RESOURCE_ZYNTHIUM_ALKALIDE,
		    RESOURCE_GHODIUM_ACID,
		    RESOURCE_GHODIUM_ALKALIDE
		];
	} else if(tier === 3) {
		compounds = [
			RESOURCE_CATALYZED_UTRIUM_ACID,
		    RESOURCE_CATALYZED_UTRIUM_ALKALIDE,
		    RESOURCE_CATALYZED_KEANIUM_ACID,
		    RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
		    RESOURCE_CATALYZED_LEMERGIUM_ACID,
		    RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
		    RESOURCE_CATALYZED_ZYNTHIUM_ACID,
		    RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
		    RESOURCE_CATALYZED_GHODIUM_ACID,
		    RESOURCE_CATALYZED_GHODIUM_ALKALIDE
		];
	}

	return compounds;
}

function runRoomMineralReports() {
	for(let i in Game.rooms) {
		if(Game.rooms[i].isMine()) {
			Game.rooms[i].mineralReport();
		}
	}
	return OK;
}

/**
 * returns string for a link that can be clicked from the console
 * to change which room you are viewing. Useful for other logging functions.
 * If you pass a room object that has a '.id' property, that object will be selected
 * upon entering the room.
 * Author: Helam, Dragnar, Fubz
 * @param roomArg {Room|RoomObject|RoomPosition|RoomName}
 * @param text {String} optional text value of link
 * @param select {boolean} whether or not you want the object to be selected when the link is clicked.
 * @returns {string}
 */
function roomLink(roomArg, text = undefined, select = true) {
    let roomName;
    let id = roomArg.id;
    if (roomArg instanceof Room) {
        roomName = roomArg.name;
    } else if (roomArg.pos !== undefined) {
        roomName = roomArg.pos.roomName;
    } else if (roomArg.roomName !== undefined) {
        roomName = roomArg.roomName;
    } else if (typeof roomArg === 'string') {
        roomName = roomArg;
    } else {
        console.log(`Invalid parameter to roomLink global function: ${roomArg} of type ${typeof roomArg}`);
    }
    text = text || (id ? roomArg : roomName);
    return `<a href="#!/room/${roomName}" ${select && id ? `onclick="angular.element('body').injector().get('RoomViewPendingSelector').set('${id}')"` : ``}>${text}</a>`;
}

function populateUtils(g) {
    g.undefToZero = undefToZero;
    g.isNullOrUndefined = isNullOrUndefined;
	g.isArrayWithContents = isArrayWithContents;
	g.getStructure = getStructure;
	g.getResourcesOfType = getResourcesOfType;
	g.calculateCreepCost = calculateCreepCost;
	g.getTierCompounds = getTierCompounds;
	g.runRoomMineralReports = runRoomMineralReports;
	g.roomLink = roomLink;
}

exports.populateUtils = populateUtils;
