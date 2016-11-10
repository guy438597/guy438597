/*jshint esversion: 6, -W041, -W080, -W018, -W083 */
var getDistance = require('command.getDistance');

module.exports = function(creep) {
    //how to use:
    // target = findClosestEnergyStorage(creep)
    // this function finds you the closest storage or container which isnt full, so people can transfer energy to it

    var targets = [];
    var distance = 1000;
    var target, tempDistance, tempTarget;
    if (Memory.structures != undefined && Memory.structures.miningContainers != undefined){
        for (let room in Game.rooms){
            //console.log(creep);
            targets = targets.concat(Game.rooms[room].find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_STORAGE && s.my && s.store[RESOURCE_ENERGY] < 1000000 || s.structureType == STRUCTURE_CONTAINER && Memory.structures.miningContainers.indexOf(s.id) == -1 && s.store[RESOURCE_ENERGY] < 2000}));
        }
        for (let i in targets){
            tempTarget = targets[i];
            tempDistance = getDistance(creep, tempTarget);
            if (tempTarget != undefined && tempTarget != null && tempDistance < distance){
                target = tempTarget;
                distance = tempDistance;
            }
        }
        if (target != undefined && target != null){
            return target;
        }
    }
    return undefined;
};
