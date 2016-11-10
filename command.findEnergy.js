/*jshint esversion: 6, -W041, -W080, -W018, -W083, -W004 */
var getDistance = require('command.getDistance');
var chooseClosest = require('command.chooseClosest');

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
        if (creep.carry.energy == creep.carryCapacity) {
            withdrawOrTransfer = typeof withdrawOrTransfer !== 'undefined' ? withdrawOrTransfer : "transfer";
        } else {
            withdrawOrTransfer = typeof withdrawOrTransfer !== 'undefined' ? withdrawOrTransfer : "withdraw";
        }
    } else {
        minEnergyInObject = typeof minEnergyInObject !== 'undefined' ? minEnergyInObject : 0;
        withdrawOrTransfer = typeof withdrawOrTransfer !== 'undefined' ? withdrawOrTransfer : "transfer";
    }
    maxRange = typeof maxRange !== 'undefined' ? maxRange : 1000;
    type = typeof type !== 'undefined' ? type : STRUCTURE_STORAGE;
    excludeListIDs = typeof excludeListIDs !== 'undefined' ? excludeListIDs : [];
    distanceFromEdge = Math.min(creep.pos.x, creep.pos.y, 49-creep.pos.x, 49 - creep.pos.y);
    distanceFromEdge = Math.min(distanceFromEdge, maxRange);

    var target;

    //recover target from memory to avoid additional pathfinding CPU calculation, if target type and distance is same as preference
    /**
    if (creep.memory != undefined && creep.memory.target != undefined) {
        target = Game.getObjectById(creep.memory.target);
        if (target === null) {
            target = undefined;
        } else {
            if (target.structureType == type) {
                if (withdrawOrTransfer == "withdraw") {
                    if (target.store[RESOURCE_ENERGY] >= minEnergyInObject || target.pos.getRangeTo(creep.pos) > maxRange) {
                        target = undefined;
                    }
                } else if (withdrawOrTransfer == "transfer") {
                    if (target.storeCapacity - _.sum(target.store) >= minEnergyInObject || target.pos.getRangeTo(creep.pos) > maxRange) {
                        target = undefined;
                    }
                }
            } else {
                if (target.amount < minEnergyInObject || target.pos.getRangeTo(creep.pos) > maxRange) {
                    target = undefined;
                }
            }
        }
    }*/

    //find new target
    if (target == undefined) {
        //if you only want to pick up energy nearby in the same room only
        if (type == "pickupEnergy") {
            if (distanceFromEdge <= 10){
                target = chooseClosest(creep.room.lookForAtArea(LOOK_RESOURCES, creep.pos.y - maxRange, creep.pos.x - distanceFromEdge, creep.pos.y + distanceFromEdge, creep.pos.x + distanceFromEdge, true).filter((s) => s.resourceType == RESOURCE_ENERGY && s.amount >= minEnergyInObject && s.pos.getRangeTo(creep) <= distanceFromEdge));
            }
            if (target == undefined){
                target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {filter: (s) => s.amount >= minEnergyInObject && s.pos.getRangeTo(creep) <= maxRange});
            }
        }
        // else if type is anything else, so like container or storage
        // if you want to withdraw energy from container/storage
        else if (withdrawOrTransfer == "withdraw") {
            target = chooseClosest(creep.room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y - distanceFromEdge, creep.pos.x - distanceFromEdge, creep.pos.y + distanceFromEdge, creep.pos.x + distanceFromEdge, true).filter((s) => s.structureType == type && s.store[RESOURCE_ENERGY] >= minEnergyInObject && excludeListIDs.indexOf(s.id) == -1 && s.pos.getRangeTo(creep) <= maxRange));
            /*else target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => s.structureType == type && s.store[RESOURCE_ENERGY] >= minEnergyInObject && excludeListIDs.indexOf(s.id) == -1 && s.pos.getRangeTo(creep) <= maxRange});
            */
            if (target == undefined){
                var targets = [];
                for (let room in Game.rooms) {
                    targets = targets.concat(Game.rooms[room].find(FIND_STRUCTURES, {
                        filter: (s) => s.structureType == type && s.store[RESOURCE_ENERGY] >= minEnergyInObject && excludeListIDs.indexOf(s.id) == -1
                    }));
                }

                target = chooseClosest(creep, targets);
            }
        }

        // if you want to put energy to container / storage
        else if (withdrawOrTransfer == "transfer") {
            target = chooseClosest(creep.room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y - maxRange, creep.pos.x - maxRange, creep.pos.y + maxRange, creep.pos.x + maxRange, true).filter((s) => s.structureType == type && s.storeCapacity - _.sum(s.store) >= minEnergyInObject && excludeListIDs.indexOf(s.id) == -1 && s.pos.getRangeTo(creep) <= maxRange));
            //console.log(creep.memory.type, target);
            if (target == undefined){
                var targets = [];
                for (let room in Game.rooms) {
                    targets = targets.concat(Game.rooms[room].find(FIND_STRUCTURES, {
                        filter: (s) => s.structureType == type && s.storeCapacity - _.sum(s.store) >= minEnergyInObject && excludeListIDs.indexOf(s.id) == -1
                    }));
                }
                target = chooseClosest(creep, targets);
            }
        }
    }
    if (target === null) {
        target = undefined;
    }

    return target;
};
