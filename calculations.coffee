
chooseClosest = (creep, targets) ->
    sortedTargets = _.sortBy(targets, (s) -> getDistance(creep, s))
    console.log "choose closest", creep, creep.pos#, creep.memory.role
    if sortedTargets.length > 0
        target = sortedTargets[0]
        if target
            # return
            target

getDistance = (creep, target) ->
    if !creep or !target
        console.log("Warning, undefined in getDistance function", creep, target)
    if creep is target
        console.log "called getdistance of same object", creep, creep.pos
        0
    distance = if creep.room is target.room then creep.pos.getRangeTo(target.pos) else path = creep.room.findPath(creep.pos, target.pos, {ignoreCreeps: true}).path
    if !distance
        #return
        -1
    #return
    distance

getDistanceInTicks = (creep, target) ->
    if !creep or !target
        console.log "Warning, undefined in getDistanceInTicks function", creep, target
    countBodyParts = _.ceil(creep.hits / 100);
    countMoveParts = creep.getActiveBodyparts(MOVE);
    countCarryParts = creep.getActiveBodyparts(CARRY);
    creepHasEnergy = Math.min(Math.min(1, creep.carry.energy), 0);
    countGenerateFatigueParts = countBodyParts - countMoveParts - countCarryParts * creepHasEnergy;
    distance = getDistance(creep, target);
    if countGenerateFatigueParts is 0
        # return
        return distance
        countTicks = -1;
    if countMoveParts > 0
        countTicks = distance * Math.max(1, _.ceil(countGenerateFatigueParts / (countMoveParts * 2)))
    # return
    return countTicks

findEnergy = (creep, minEnergyInObject = creep.carry.energy, maxRange = 10000, type = STRUCTURE_CONTAINER, withdrawOrTransfer = "", excludeListIDs = []) ->
    withdrawOrTransfer = (if creep.carry.energy == creep.carryCapacity then "transfer" else "withdraw") if !withdrawOrTransfer
    distanceFromEdge = Math.min(creep.pos.x, creep.pos.y, 49-creep.pos.x, 49 - creep.pos.y)
    distanceFromEdge = Math.min(distanceFromEdge, maxRange)
    console.log "findenergy", creep, minEnergyInObject, maxRange, type, withdrawOrTransfer , excludeListIDs.length
    #target = findEnergy(creep, energy, distance, structureType, "withdraw", excludeListIDs = excludeListIDs)
    if type is "pickupEnergy"
        if distanceFromEdge <= 10
            target = chooseClosest(creep.room.lookForAtArea(LOOK_RESOURCES, creep.pos.y - distanceFromEdge, creep.pos.x - distanceFromEdge, creep.pos.y + distanceFromEdge, creep.pos.x + distanceFromEdge, true).filter( (s) -> s.resourceType is RESOURCE_ENERGY and s.amount >= minEnergyInObject and s.pos.getRangeTo(creep) <= distanceFromEdge))
        else
            target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, filter: (s) => s.amount >= minEnergyInObject && s.pos.getRangeTo(creep) <= maxRange)
        if target
            target

    else if withdrawOrTransfer is "withdraw"
        if distanceFromEdge <= 10
            target = chooseClosest(creep.room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y - distanceFromEdge, creep.pos.x - distanceFromEdge, creep.pos.y + distanceFromEdge, creep.pos.x + distanceFromEdge, true).filter( (s) => s.structureType == type and s.store[RESOURCE_ENERGY] >= minEnergyInObject and s.id not in excludeListIDs and s.pos.getRangeTo(creep) <= maxRange));
        else
            targets = []
            for name,room of Game.rooms
                targets = targets.concat(room.find(FIND_STRUCTURES).filter( (s) -> s.structureType is type and s.store[RESOURCE_ENERGY] >= minEnergyInObject and s.id not in excludeListIDs))
        if targets.length > 0
            target = chooseClosest(creep, targets)
        if target
            # return
            target

    else if withdrawOrTransfer is "transfer"
        if distanceFromEdge <= 10
            target = chooseClosest(creep.room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y - distanceFromEdge, creep.pos.x - distanceFromEdge, creep.pos.y + distanceFromEdge, creep.pos.x + distanceFromEdge, true).filter( (s) => s.structureType == type and s.storeCapacity - _.sum(s.store) >= minEnergyInObject and s.id not in excludeListIDs and s.pos.getRangeTo(creep) <= maxRange))
        else
            targets = []
            for name,room of Game.rooms
                targets = targets.concat(room.find(FIND_STRUCTURES).filter( (s) -> s.structureType is type and s.storeCapacity - _.sum(s.store) >= minEnergyInObject and s.id not in excludeListIDs))
        if targets.length > 0
            target = chooseClosest(creep, targets)
        if target
            # return
            target

module.exports =
    chooseClosest: chooseClosest
    findEnergy: findEnergy
    getDistance: getDistance
    getDistanceInTicks: getDistanceInTicks
