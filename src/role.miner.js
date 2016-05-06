/*
 * role.remoteMiner
 */

module.exports = {
    run(creep) {
        //creep.say('rMiner');
        // state 0 is head to next room
        // state 1 harvest

        var checkPointAway = new RoomPosition(41, 33, 'E7S23');

        if (creep.memory.state === undefined) {
            creep.memory.state = 0;
        }

        if ((creep.memory.state === 0) && (JSON.stringify(creep.pos) === JSON.stringify(checkPointAway))) {
            creep.say('away pt');
            creep.memory.state = 1;
        }


        if (creep.memory.state === 0) {
            creep.moveTo(checkPointAway);
        } else if (creep.memory.state === 1) {
            // harvest
            var closestSource = creep.pos.findClosestByPath(FIND_SOURCES);
            if (creep.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                creep.moveTo(closestSource);
            }
        }
    }
};
