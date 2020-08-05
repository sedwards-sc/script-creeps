/* jshint esversion: 6 */

const RESERVATION_BUFFER = 1000;
const VISION_LOSS_DELAY = 100;

class ReserverQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('reserver', PRIORITY_TRIVIAL, id, flag, colony);
	}

	initQuest() {
		if(this.hasVision) {
			this.memory.lastVisionTick = Game.time;

			if(this.flag.room.controller &&
				this.flag.room.controller.reservation &&
				this.flag.room.controller.reservation.username === USERNAME &&
				this.flag.room.controller.reservation.ticksToEnd > RESERVATION_BUFFER) {
				this.reservedWithBuffer = true;
			}
		}

		this.reservers = [];
	}

	runCensus() {
		let reserverBody = [MOVE, MOVE, CLAIM, CLAIM];
		let maxReservers = 0;
		if(this.spawnGroup.maxSpawnEnergy < calculateCreepCost(reserverBody)) {
			this.errorLog("insufficient energy capacity to spawn reserver", ERR_NOT_ENOUGH_RESOURCES);
		} else if(!this.memory.lastVisionTick || Game.time > this.memory.lastVisionTick + VISION_LOSS_DELAY || (this.hasVision && !this.reservedWithBuffer)) {
			maxReservers = 1;
		}
		this.reservers = this.attendance(this.nameId, reserverBody, maxReservers, {blindSpawn: true});
	}

	runActivities() {
		for(let creep of this.reservers) {
			if(!creep.spawning) {
				this.reserverActions(creep)
			}
		}
	}

	questEnd() {
	}

	reserverActions(creep) {
		if(creep.fleeHostiles()) {
			creep.memory.avoidMe = false;
			return;
		}

		if(creep.pos.isEqualTo(this.flag)) {
			creep.memory.avoidMe = true;
			let reserveReturn = creep.reserveOrAttackController(creep.room.controller);
			if(reserveReturn !== OK) {
				creep.errorLog('could not successfully reserve controller', reserveReturn, 4);
			}
		} else {
			creep.moveTo(this.flag);
		}
	}
}

global.ReserverQuest = ReserverQuest;
