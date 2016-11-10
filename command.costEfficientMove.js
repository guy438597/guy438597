/*jshint esversion: 6, -W041, -W080, -W018 */

//uses about 0.2-0.5 cpu
module.exports = function(creep, roomPosition) {
    //how to use:
    // noError = costEfficientMove(creep, target)
    // this will hopefully reduce CPU usage
    if (creep.moveTo(roomPosition, {
            noPathFinding: false
        }) == ERR_NOT_FOUND) {
        creep.moveTo(roomPosition);
        return 1;
    } else {
        return 0;
    }
};
