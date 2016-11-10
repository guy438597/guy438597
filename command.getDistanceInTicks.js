/*jshint esversion: 6, -W041, -W080, -W018 */
var getDistance = require('command.getDistance');

module.exports = function(creep, target) {
    if (creep == undefined || target == undefined) {
        console.log("Warning, undefined in getDistanceInTicks function", creep, target);
    }
    var countBodyParts = _.ceil(creep.hits / 100);
    var countMoveParts = creep.getActiveBodyparts(MOVE);
    var countCarryParts = creep.getActiveBodyparts(CARRY);
    var creepHasEnergy = Math.min(Math.min(1, creep.carry.energy), 0);
    var countGenerateFatigueParts = countBodyParts - countMoveParts - countCarryParts * creepHasEnergy;
    // calculate the distance between creep and target
    var distance = getDistance(creep, target);

    // if no bodyparts generate fatigue, the result is the same as distance to target
    if (countGenerateFatigueParts == 0) {
        return distance;
    }

    //
    var countTicks = -1;
    if (countMoveParts > 0) {
        countTicks = distance * Math.max(1, _.ceil(countGenerateFatigueParts / (countMoveParts * 2)));
    }
    return countTicks;
};
