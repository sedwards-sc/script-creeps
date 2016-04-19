/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.defender');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    run(creep) {
        var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
		if(target) {
			if(creep.attack(target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			}
		}
    }
};