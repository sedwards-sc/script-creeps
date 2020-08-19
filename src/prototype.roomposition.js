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
    // seems like this method was causing an error when fleeing creep was on an exit tile
    // TODO: ensure this solution doesn't interfere with anything else using this method (other than fleeing)
	if(x < 0) x = 0;
	if(y < 0) y = 0;
	if(x > 49) x = 49;
	if(y > 49) y = 49;
	return new RoomPosition(x, y, room);
};

/**
* @param structureType
* @returns {Structure} structure of type structureType that resides at position (undefined if no structure of that type is present)
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
		if(ignoreCreeps || this.lookFor(LOOK_CREEPS).length === 0) {

			// look for impassible structures
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

/**
 * Returns all surrounding positions that are currently open
 * @param ignoreCreeps - if true, will consider positions containing a creep to be open
 * @returns {RoomPosition[]}
 */
RoomPosition.prototype.openAdjacentSpots = function(ignoreCreeps) {
	let positions = [];
	for(let i = 1; i <= 8; i++) {
		let testPosition = this.getPositionAtDirection(i);

		if(testPosition.isPassible(ignoreCreeps)) {
			// passed all tests
			positions.push(testPosition);
		}
	}
	return positions;
};

RoomPosition.prototype.getFleeOptions = function(roomObject) {
	let fleePositions = [];
	let currentRange = this.getRangeTo(roomObject);

	for(let i = 1; i <= 8; i++) {
		let fleePosition = this.getPositionAtDirection(i);
		if(fleePosition.x > 0 && fleePosition.x < 49 && fleePosition.y > 0 && fleePosition.y < 49) {
			let rangeToHostile = fleePosition.getRangeTo(roomObject);
			if(rangeToHostile > 0) {
				if(rangeToHostile < currentRange) {
					fleePosition.veryDangerous = true;
				} else if(rangeToHostile === currentRange) {
					fleePosition.dangerous = true;
				}
				fleePositions.push(fleePosition);
			}
		}
	}

	return fleePositions;
};

RoomPosition.prototype.bestFleePosition = function(hostile, ignoreRoads = false, swampRat = false) {
	let options = [];

	let fleeOptions = this.getFleeOptions(hostile);
	for(let i = 0; i < fleeOptions.length; i++) {
		let option = fleeOptions[i];
		let terrain = option.lookFor(LOOK_TERRAIN)[0];
		if(terrain !== "wall") {
			let creepsInTheWay = option.lookFor(LOOK_CREEPS);
			if(creepsInTheWay.length === 0) {
				let structures = option.lookFor(LOOK_STRUCTURES);
				let hasRoad = false;
				let impassible = false;
				for(let structure of structures) {
					if(_.includes(OBSTACLE_OBJECT_TYPES, structure.structureType)) {
						// can't go through it
						impassible = true;
						break;
					}
					if(structure.structureType === STRUCTURE_ROAD) {
						hasRoad = true;
					}
				}

				if(!impassible) {
					let preference = 0;

					if(option.dangerous) {
						preference += 10;
					} else if(option.veryDangerous) {
						preference += 20;
					}

					if(hasRoad) {
						if(ignoreRoads) {
							preference += 2;
						} else {
							preference += 1;
						}
					} else if(terrain === "plain") {
						preference += 2;
					} else if(terrain === "swamp") {
						if(swampRat) {
							preference += 1;
						} else {
							preference += 5;
						}
					}

					options.push({position: option, preference: preference});
				}
			}
		}
	}

	if(options.length > 0) {
		options = _(options).shuffle().sortBy("preference").value();

		return options[0].position;
	}
};
