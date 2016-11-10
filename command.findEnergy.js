/*jshint esversion: 6, -W041, -W080, -W018, -W083, -W004 */
var getDistance = require('command.getDistance');

// uses approx 0.1-0.3 cpu
module.exports = function(creep, minEnergyInObject, maxRange, type, withdrawOrTransfer, excludeListIDs) {
    /**
    finds the nearest energy resource / container / storage where you can withdraw / transfer energy from / to

    arguments:
    creep: a creep or a container or anything with a .pos
    minEnergyInObject: the minimum amount of energy you want to find on the ground, or if you want to find a container, the container needs to have at least this amount - same with storage
    maxRange: the max distance to the object - if maxRange = 5 and found storage is 6 range away, the target will be =undefined
    type: if its ="pickupEnergy" then this function will try to find energy on the ground, other arguments are STRUCTURE_CONTAINER or STRUCTURE_STORAGE
    withdrawOrTransfer: if you want to "withdraw" from container/storage or if you want to put energy in with "transfer"
    excludeMiningContainers: if true, creeps wont withdraw / transfer energy from / to mining containers

    returnsvalue: a target object if found, if nothing is found: return undefined
    */

    if (creep.ticksToLive != undefined) {
        minEnergyInObject = minEnergyInObject || creep.carryCapacity;
        if (creep.carry.energy == creep.carryCapacity){
            withdrawOrTransfer = typeof withdrawOrTransfer !== 'undefined' ? withdrawOrTransfer : "transfer";
            //withdrawOrTransfer = withdrawOrTransfer || "transfer";
        }
        else{
            withdrawOrTransfer = typeof withdrawOrTransfer !== 'undefined' ? withdrawOrTransfer : "withdraw";
            //withdrawOrTransfer = withdrawOrTransfer || "withdraw";
        }
    }
    else{
        minEnergyInObject = typeof minEnergyInObject !== 'undefined' ? minEnergyInObject : 0;
        //minEnergyInObject = minEnergyInObject || 0;
        withdrawOrTransfer = typeof withdrawOrTransfer !== 'undefined' ? withdrawOrTransfer : "transfer";
        //withdrawOrTransfer = withdrawOrTransfer || "transfer";
    }
    maxRange = typeof maxRange !== 'undefined' ? maxRange : 1000;
    //maxRange = maxRange || 1000;
    type = typeof type !== 'undefined' ? type : STRUCTURE_STORAGE;
    //type = type || STRUCTURE_STORAGE;
    excludeListIDs = typeof excludeListIDs !== 'undefined' ? excludeListIDs : [];
    //excludeListIDs = excludeListIDs || [];


    var target;

    //recover target from memory to avoid additional pathfinding CPU calculation, if target type and distance is same as preference
    if (creep.memory != undefined && creep.memory.target != undefined){
        target = Game.getObjectById(creep.memory.target);
        if (target == null){
            target = undefined;
        }
        else {
            if (target.structureType == type){
                if (withdrawOrTransfer == "withdraw"){
                    if (target.store[RESOURCE_ENERGY] >= minEnergyInObject || target.pos.getRangeTo(creep.pos) > maxRange) {
                        target = undefined;
                    }
                }
                else if (withdrawOrTransfer == "transfer"){
                    if (target.storeCapacity - _.sum(target.store) >= minEnergyInObject || target.pos.getRangeTo(creep.pos) > maxRange) {
                        target = undefined;
                    }
                }
            }
            else {
                if (target.amount < minEnergyInObject || target.pos.getRangeTo(creep.pos) > maxRange){
                    target = undefined;
                }
            }
        }
    }

    //find new target
    if (target == undefined){
        //if you only want to pick up energy nearby in the same room only
        if (type == "pickupEnergy"){
            target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {filter: (s) => s.amount >= minEnergyInObject && s.pos.getRangeTo(creep.pos) <= maxRange});
        }
        // else if type is anything else, so like container or storage
        else {
            // if you want to withdraw energy from container/storage
            if (withdrawOrTransfer == "withdraw"){
                //target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => s.structureType == type && s.store[RESOURCE_ENERGY] >= minEnergyInObject && s.pos.getRangeTo(creep.pos) <= maxRange});
                if (target == undefined){
                    //loop over all rooms to find storages to drop stuff to
                    var targets = [];
                    for (let room in Game.rooms){
                        targets = targets.concat(Game.rooms[room].find(FIND_STRUCTURES, {filter: (s) => s.structureType == type && s.store[RESOURCE_ENERGY] >= minEnergyInObject}));
                    }
                    //console.log(creep.memory.role, targets);
                    if (targets){
                        for (let i in targets){
                            if (excludeListIDs != undefined && excludeListIDs.indexOf(targets[i].id) != -1){
                                continue;
                            }
                            /*if (includeMiningContainers == 0 && Memory.structures != undefined && Memory.structures.miningContainers != undefined && Memory.structures.miningContainers.indexOf(targets[i].id) != -1) {
                                continue;
                            }*/
                            tempTarget = targets[i];
                            tempDistance = getDistance(creep, tempTarget);
                            if (target == undefined){
                                target = tempTarget;
                                distance = tempDistance;
                            }
                            else if (tempDistance < distance && tempDistance <= maxRange){
                                target = tempTarget;
                                distance = tempDistance;
                            }
                        }
                    }
                }
            }

            // if you want to put energy to container / storage
            else if (withdrawOrTransfer == "transfer") {
                //target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => s.structureType == type && s.storeCapacity - _.sum(s.store) > minEnergyInObject && s.pos.getRangeTo(creep.pos) <= maxRange});
                if (target == undefined){
                    //loop over all rooms to find containers/storages to drop stuff to
                    var targets = [];
                    for (let room in Game.rooms){
                        targets = targets.concat(Game.rooms[room].find(FIND_STRUCTURES, {filter: (s) => (s.structureType == type && s.storeCapacity - _.sum(s.store) >= minEnergyInObject)}));
                    }
                    //console.log(targets);
                    //console.log("testo", creep.memory.role, targets);
                    if (targets.length > 0){
                        for (let i in targets){
                            if (excludeListIDs != undefined && excludeListIDs.indexOf(targets[i].id) != -1){
                                continue;
                            }
                            /*if (includeMiningContainers == 0 && Memory.structures != undefined && Memory.structures.miningContainers != undefined && Memory.structures.miningContainers.indexOf(targets[i].id) != -1) {
                                continue;
                            }*/
                            tempTarget = targets[i];
                            if (tempTarget.ticksToRegeneration != undefined){
                                continue;
                            }
                            tempDistance = getDistance(creep, tempTarget);
                            if (target == undefined){
                                target = tempTarget;
                                distance = tempDistance;
                            }
                            else if (tempDistance < distance && tempDistance <= maxRange){
                                target = tempTarget;
                                distance = tempDistance;
                            }
                        }
                    }
                }
            }
        }
    }
    if (target == null){
        target = undefined;
    }

    return target;
};
