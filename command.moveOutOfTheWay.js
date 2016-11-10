/*jshint esversion: 6, -W041, -W080, -W018 */

// uses approx 0.01 - 0.03 cpu
module.exports = function(creep) {
    // in case a creep is idle and blocking the way, use this function to make him move out of the way of friendly creeps

    otherCreep = creep.pos.findClosestByRange(FIND_MY_CREEPS, {filter: (c) => c != creep && creep.pos.getRangeTo(c) <= 2});

    if (otherCreep != undefined){
        //console.log(creep, otherCreep, creep.pos.getDirectionTo(otherCreep));
        creep.move((4 + creep.pos.getDirectionTo(otherCreep) + Math.floor((Math.random() * 3) - 1)) % 8);
    }
};
