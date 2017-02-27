/* jshint esversion: 6 */
/*
 * prototype.roomposition
 */

 RoomPosition.prototype.toString = function(htmlLink = true, id = undefined, memWatch = undefined) {
	if(htmlLink){
		var onClick = '';
		if(id) {
			onClick += `angular.element('body').injector().get('RoomViewPendingSelector').set('${id}');`;
		}
		if(memWatch) {
			onClick += `angular.element($('section.memory')).scope().Memory.addWatch('${memWatch}'); angular.element($('section.memory')).scope().Memory.selectedObjectWatch='${memWatch}';`;
		}
		return `<a href="#!/room/${this.roomName}" onClick="${onClick}">[${ this.roomName } ${ this.x },${ this.y }]</a>`;
	}
	return `[${this.roomName} ${this.x},${this.y}]`;
 };

/**
* returns position at direction relative to this position
* @param direction
* @param range - optional, can return position with linear distance > 1
* @returns {RoomPosition}
*/
RoomPosition.prototype.getPositionAtDirection = function(direction, range) {
	if(!range) {
		range = 1;
	}
	let x = this.x;
	let y = this.y;
	let room = this.roomName;

	if (direction === 1) {
		y -= range;
	} else if (direction === 2) {
		y -= range;
		x += range;
	} else if (direction === 3) {
		x += range;
	} else if (direction === 4) {
		x += range;
		y += range;
	} else if (direction === 5) {
		y += range;
	} else if (direction === 6) {
		y += range;
		x -= range;
	} else if (direction === 7) {
		x -= range;
	} else if (direction === 8) {
		x -= range;
		y -= range;
	}
	return new RoomPosition(x, y, room);
};

/**
* @param structureType
* @returns {Structure} structure of type structureType that resides at position (null if no structure of that type is present)
*/
RoomPosition.prototype.lookForStructure = function(structureType) {
	let structures = this.lookFor(LOOK_STRUCTURES);
	return _.find(structures, {structureType: structureType});
};

/**
* Look if position is currently open/passible
* @param ignoreCreeps - if true, consider positions containing creeps to be open
* @returns {boolean}
*/
RoomPosition.prototype.isPassible = function(ignoreCreeps) {
	// look for walls
	if(_.head(this.lookFor(LOOK_TERRAIN)) !== "wall") {

		// look for creeps
		if (ignoreCreeps || this.lookFor(LOOK_CREEPS).length === 0) {

			// look for impassible structions
			if(_.filter(this.lookFor(LOOK_STRUCTURES), (struct) => {
				return struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_CONTAINER && struct.structureType !== STRUCTURE_RAMPART;
			}).length === 0 ) {
				// passed all tests
				return true;
			}
		}
	}

	return false;
};

RoomPosition.prototype.isNearExit = function(range) {
	return this.x - range <= 0 || this.x + range >= 49 || this.y - range <= 0 || this.y + range >= 49;
};
