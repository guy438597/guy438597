/*jshint esversion: 6, -W041, -W080, -W018, -W083 */

module.exports = function(creep, minEnergyInObject, maxContainerRange) {
    // this function finds the closest energy source where creeps can withdraw from

    //maxPickupRange = maxPickupRange || "15";
    minEnergyInObject = minEnergyInObject || creep.carryCapacity;
    maxContainerRange = maxContainerRange || "100";
    //how to use:
    // costEfficientMove(creep, target)
    var target;
    /*
    target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {filter: (s) => s.amount >= creep.carryCapacity && s.pos.getRangeTo(creep.pos) < maxPickupRange});
    // try to harvest energy, if the source is not in range
    if (target != undefined) {
        if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
            // move towards the source
            creep.say(target.amount, "pick up");
            costEfficientMove(creep, target);
        }
    }
    else{
        var objectWithDraw = undefined;
        if (objectWithDraw == undefined){
            var temp = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_STORAGE) &&
                s.store[RESOURCE_ENERGY] >= creep.carryCapacity && s.pos.getRangeTo(creep.pos) < 150// s.energyCapacity
            });
            if (temp != undefined && temp != null) {
                objectWithDraw = temp;
                //console.log("hi1", objectWithDraw);
            }
        }*/
        /*if (objectWithDraw == undefined){
            var temp = (creep.pos.findClosestByPath(Game.structures));
            if (temp != undefined && temp != null) {
                objectWithDraw = temp;
                console.log("hi2", objectWithDraw);
            }
        }*/
    var temp;
    if (target == undefined){
        temp = creep.room.storage;

        if (temp != undefined && temp != null && temp.store[RESOURCE_ENERGY] >= minEnergyInObject) {
            target = temp;
            return target;
            //console.log("hi3", objectWithDraw);
        }
    }
    if (target == undefined) {
        if (Memory.structures != undefined){
            if (Memory.structures.miningContainers != undefined){
                var targets = [];
                for (let room in Game.rooms){
                    targets = targets.concat(Game.rooms[room].find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_STORAGE && s.my || s.structureType == STRUCTURE_CONTAINER && Memory.structures.miningContainers.indexOf(s.id) == -1 && s.store[RESOURCE_ENERGY] > minEnergyInObject}));
                }
                for (let tempTargetID in targets){
                    tempTarget = Game.getObjectById(tempTargetID);
                    if (tempTarget != undefined){
                        tempDistance = getDistance(creep, tempTarget);
                        if (tempDistance < distance){
                            target = tempTarget;
                            distance = tempDistance;
                        }
                    }
                }
                if (target != undefined && temp != null){
                    return target;
                }
            }
        }
    }
    if (target == undefined){
        temp = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_CONTAINER) &&
            s.store[RESOURCE_ENERGY] >= minEnergyInObject && s.pos.getRangeTo(creep.pos) < maxContainerRange// s.energyCapacity
        });
        if (temp != undefined && temp != null) {
            target = temp;
            return target;
            //console.log("hi3", objectWithDraw);
        }
    }
    return undefined;
};
