/*
 * role.reserver
 */

module.exports = {
	run(creep) {
		creep.say('reserver');
		
		var controllerToReserve = Game.getObjectById('55db333cefa8e3fe66e056d8');
		if(creep.reserveController(controllerToReserve) === ERR_NOT_IN_RANGE) {
			creep.moveTo(controllerToReserve);
		}
	}
};
