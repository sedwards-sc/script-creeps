/* jshint esversion: 6 */

class SentinelQuest extends Quest {

	/**
	 *
	 */
	constructor(id, flag, colony) {
		super('sentinel', PRIORITY_MEDIUM - 1, id, flag, colony);
	}

	initQuest() {
		this.sentinels = [];
	}

	runCensus() {
		let options = {};
		options.prespawn = 0;
		options.blindSpawn = true;
		// TODO: only spawn when there are hostiles in the room to watch
		this.sentinels = this.attendance(this.nameId, this.spawnGroup.bodyRatio({move: 4, attack: 3, heal: 1}, 1, 3), 1, options);
	}

	runActivities() {
		for(let creep of this.sentinels) {
			if(!creep.spawning) {
				this.sentinelActions(creep)
			}
		}
	}

	questEnd() {
	}

	sentinelActions(creep) {
		if(creep.healingSelf(creep.hitsMax / 2)) {
			 creep.heal(creep);
			 creep.fleeHostiles();
			 return;
		}

		// have enough hit points for battle

		let withinRoom = creep.pos.roomName === this.flag.pos.roomName;
		if(!withinRoom) {
			creep.blindMoveTo(this.flag);
			return;
		}

		// inside room to watch over

		let attackTarget;
		let attacking = false;
		if(creep.room.hostiles.length > 0) {
			attackTarget = creep.pos.findClosestByRange(creep.room.hostiles);
			if(creep.pos.isNearTo(attackTarget)) {
				creep.attack(attackTarget);
				attacking = true;
			} else {
				creep.blindMoveTo(attackTarget);
			}
		} else {
			// heal to max if no hostiles
			if(creep.healingSelf(creep.hitsMax)) {
				 creep.heal(creep);
				 return;
			}
		}

		if(!attacking) {
			// heal self and others on route
			let healTarget = creep.pos.findClosestByRange(creep.room.findMyCreeps(), {
				filter: function(c) {
					return c.hits < c.hitsMax;
				}
			});

			if(healTarget) {
				if(creep.pos.isNearTo(healTarget)) {
					creep.heal(healTarget);
				} else {
					creep.rangedHeal(healTarget);
					if(!attackTarget) {
						creep.blindMoveTo(healTarget);
					}
				}
			}

			if(!attackTarget && !healTarget) {
				let invaderCores = creep.room.findStructures(STRUCTURE_INVADER_CORE);
				if(invaderCores.length > 0) {
					let coreTarget = _.first(invaderCores);
					if(creep.pos.isNearTo(coreTarget)) {
						creep.attack(coreTarget)
					} else {
						creep.blindMoveTo(coreTarget);
					}
				} else if(!creep.pos.isNearTo(this.flag)) {
					creep.blindMoveTo(this.flag);
				}
			}
		}
	}
}

global.SentinelQuest = SentinelQuest;
