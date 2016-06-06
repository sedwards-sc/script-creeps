/*
 * role.reserver
 */

module.exports = {
	run(creep) {
		creep.say('reserver');
		
		if(creep.memory.controllerId === undefined) {
			return;
		}
		
		var controllerToReserve = Game.getObjectById(creep.memory.controllerId);
		if(creep.reserveController(controllerToReserve) === ERR_NOT_IN_RANGE) {
			creep.moveTo(controllerToReserve);
		}
	}
};
