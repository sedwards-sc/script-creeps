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
    		RESOURCE_LEMERGIUM_OXIDE,
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
 * to view a given room's history at the current tick. Useful for notify functions.
 * If you pass a room object that has a '.id' property, that object will be selected
 * upon entering the room.
 * @param roomArg {Room|RoomObject|RoomPosition|RoomName}
 * @param text {String} optional text value of link
 * @param select {boolean} whether or not you want the object to be selected when the link is clicked.
 * @returns {string}
 */
function timeLink(roomArg, text = undefined, select = true) {
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
        console.log(`Invalid parameter to timeLink global function: ${roomArg} of type ${typeof roomArg}`);
    }
    text = text || (id ? roomArg : roomName);
    return `<a href="#!/history/${roomName}?t=${Game.time}" ${select && id ? `onclick="angular.element('body').injector().get('RoomViewPendingSelector').set('${id}')"` : ``}>${text}</a>`;
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

function errorCodeToText(errorCode) {
	switch(errorCode) {
		case 0:
			return 'OK';
		case -1:
			return 'ERR_NOT_OWNER';
		case -2:
			return 'ERR_NO_PATH';
		case -3:
			return 'ERR_NAME_EXISTS';
		case -4:
			return 'ERR_BUSY';
		case -5:
			return 'ERR_NOT_FOUND';
		case -6:
			return 'ERR_NOT_ENOUGH_ENERGY or RESOURCES or EXTENSIONS';
		case -7:
			return 'ERR_INVALID_TARGET';
		case -8:
			return 'ERR_FULL';
		case -9:
			return 'ERR_NOT_IN_RANGE';
		case -10:
			return 'ERR_INVALID_ARGS';
		case -11:
			return 'ERR_TIRED';
		case -12:
			return 'ERR_NO_BODYPART';
		case -14:
			return 'ERR_RCL_NOT_ENOUGH';
		case -15:
			return 'ERR_GCL_NOT_ENOUGH';
		default:
			return `Unknown: ${errorCode}`;
	}
}

function clampDirection(direction) {
	while(direction < 1) direction += 8;
	while(direction > 8) direction -= 8;
	return direction;
}

function checkEnemy(username, roomName) {
	if(ALLIES[username]) {
		return false;
	}

	// make note of non-ally, non-npc creeps
	if(username !== "Invader" && username !== "Source Keeper") {
		this.strangerDanger(username, roomName);
	}
	return true;
}

function strangerDanger(username, roomName) {
	if(!Memory.strangerDanger) {
		Memory.strangerDanger = {};
	}
	if(!Memory.strangerDanger[username]) {
		Memory.strangerDanger[username] = [];
	}
	let lastReport = _.last(Memory.strangerDanger[username]);
	if(!lastReport || lastReport.tickSeen < Game.time - 500 ) {
		let report = {
			tickSeen: Game.time,
			roomName: roomName
		};
		let msgText = `STRANGER DANGER: one of ${username}'s creeps seen in ${Game.rooms[roomName]} at ${Game.time}`;
		let severity = 5;
		if(!Game.rooms[roomName].isMine()) {
			severity = 4;
		}
		Logger.log(msgText, severity);
		Memory.strangerDanger[username].push(report);
		while(Memory.strangerDanger[username].length > 10) {
			Memory.strangerDanger[username].shift();
		}
	}
}

function addStructuresToMatrix(matrix, room, roadCost = 1) {
	room.find(FIND_STRUCTURES).forEach(function(structure) {
		if(structure instanceof StructureRampart) {
			if(!structure.my) {
				matrix.set(structure.pos.x, structure.pos.y, 0xff);
			}
		} else if(structure instanceof StructureRoad) {
			// Favor roads over plain tiles
			matrix.set(structure.pos.x, structure.pos.y, roadCost);
		} else if(structure.structureType !== STRUCTURE_CONTAINER) {
			// Can't walk through non-walkable buildings
			matrix.set(structure.pos.x, structure.pos.y, 0xff);
		}
	});
	return matrix;
}

function addCreepsToMatrix(matrix, room, addFriendly = true, addHostile = true) {
	room.find(FIND_CREEPS).forEach((creep) => {
		if(!creep.owner) {
			if(addHostile) {
				matrix.set(creep.pos.x, creep.pos.y, 0xff);
			}
		} else if(ALLIES[creep.owner.username]) {
			if(addFriendly) {
				matrix.set(creep.pos.x, creep.pos.y, 0xff);
			}
		} else {
			if(addHostile) {
				matrix.set(creep.pos.x, creep.pos.y, 0xff);
			}
		}
	});
	return matrix;
}

function addTerrainToMatrix(matrix, roomName) {
	for(let x = 0; x < 50; x++) {
		for(let y = 0; y < 50; y++) {
			let terrain = Game.map.getTerrainAt(x, y, roomName);
			if(terrain === "wall") {
				matrix.set(x, y, 0xff);
			} else if(terrain === "swamp") {
				matrix.set(x, y, 5);
			} else {
				matrix.set(x, y, 1);
			}
		}
	}
	return;
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
	g.timeLink = timeLink;
	g.errorCodeToText = errorCodeToText;
	g.clampDirection = clampDirection;
	g.checkEnemy = checkEnemy;
	g.strangerDanger = strangerDanger;
	g.addStructuresToMatrix = addStructuresToMatrix;
	g.addCreepsToMatrix = addCreepsToMatrix;
	g.addTerrainToMatrix = addTerrainToMatrix;
}

exports.populateUtils = populateUtils;
