/*jshint esversion: 6, -W041, -W080, -W018 */
var getDistance = require('command.getDistance');

module.exports = function(creep, targets) {
    // this function returns the path distance from two positions - especially useful if positions are not in the same room (havent found a function for that one yet)
    // how to use:
    // distance = getDistance(creep, target)
    // returns integer
    var target;
    var distance;
    var tempTarget;
    var tempDistance;
    for (let i in targets) {
        tempTarget = targets[i];
        if (tempTarget != undefined) {
            if (target == undefined) {
                target = tempTarget;
                distance = getDistance(creep, target);
            } else {
                tempDistance = getDistance(creep, target);
                if (distance > tempDistance) {
                    target = tempTarget;
                    distance = getDistance(creep, tempTarget);
                }
            }
        }
    }
    return target;
};
