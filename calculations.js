var chooseClosest, findEnergy, getDistance, getDistanceInTicks,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

chooseClosest = function(creep, targets) {
  var distance, i, j, len, t, target, tempDistance;
  if (!targets) {
    void 0;
  }
  if (targets.length === 0) {
    void 0;
  } else if (targets.length === 1) {
    target = targets[0];
  } else {
    target = targets[0];
    distance = getDistance(creep, target);
    for (i = j = 0, len = targets.length; j < len; i = ++j) {
      t = targets[i];
      if (t) {
        tempDistance = getDistance(creep, t);
        if (tempDistance !== -1 && tempDistance < distance) {
          distance = tempDistance;
          target = t;
        }
      }
    }
  }
  if (!target) {
    void 0;
  }
  return target;

  /*
  if targets.length <= 0
      undefined
  if targets
      if targets.length is 0
          undefined
      else if targets.length is 1
          targets[0]
  targets = targets.filter( (s) -> s isnt undefined)
  sortedTargets = _.sortBy(targets, (s) -> getDistance(creep, s))
  console.log "choose closest", creep, creep.pos, sortedTargets#, creep.memory.role
  if sortedTargets.length > 0
      target = sortedTargets[0]
      if target
           * return
          target
   */
};

getDistance = function(creep, target) {
  var distance;
  if (!creep || !target) {
    console.log("Warning, undefined in getDistance functionn", creep, target);
    100000;
  }
  if (!target) {
    100000;
  }
  if (creep === target) {
    console.log("called getDistance of same object", creep, creep.pos);
    0;
  }
  distance = creep.room === target.room ? creep.pos.getRangeTo(target) : creep.room.findPath(creep.pos, target.pos).length;
  if (!distance) {
    -1;
  }
  return distance;
};

getDistanceInTicks = function(creep, target) {
  var countBodyParts, countCarryParts, countGenerateFatigueParts, countMoveParts, countTicks, creepHasEnergy, distance;
  if (!creep || !target) {
    console.log("Warning, undefined in getDistanceInTicks function", creep, target);
  }
  countBodyParts = _.ceil(creep.hits / 100);
  countMoveParts = creep.getActiveBodyparts(MOVE);
  countCarryParts = creep.getActiveBodyparts(CARRY);
  creepHasEnergy = Math.min(Math.min(1, creep.carry.energy), 0);
  countGenerateFatigueParts = countBodyParts - countMoveParts - countCarryParts * creepHasEnergy;
  distance = getDistance(creep, target);
  if (countGenerateFatigueParts === 0) {
    return distance;
    countTicks = -1;
  }
  if (countMoveParts > 0) {
    countTicks = distance * Math.max(1, _.ceil(countGenerateFatigueParts / (countMoveParts * 2)));
  }
  return countTicks;
};

findEnergy = function(creep, minEnergyInObject, maxRange, type, withdrawOrTransfer, excludeListIDs) {
  var distanceFromEdge, name, ref, ref1, room, target, targets;
  if (minEnergyInObject == null) {
    minEnergyInObject = creep.carry.energy;
  }
  if (maxRange == null) {
    maxRange = 10000;
  }
  if (type == null) {
    type = STRUCTURE_CONTAINER;
  }
  if (withdrawOrTransfer == null) {
    withdrawOrTransfer = "";
  }
  if (excludeListIDs == null) {
    excludeListIDs = [];
  }
  if (!withdrawOrTransfer) {
    withdrawOrTransfer = (creep.carry.energy === creep.carryCapacity ? "transfer" : "withdraw");
  }
  distanceFromEdge = Math.min(creep.pos.x, creep.pos.y, 49 - creep.pos.x, 49 - creep.pos.y);
  distanceFromEdge = Math.min(distanceFromEdge, maxRange);
  if (type === "pickupEnergy") {
    if (distanceFromEdge <= 10) {
      targets = creep.room.lookForAtArea(LOOK_RESOURCES, creep.pos.y - distanceFromEdge, creep.pos.x - distanceFromEdge, creep.pos.y + distanceFromEdge, creep.pos.x + distanceFromEdge, true).filter(function(s) {
        return s.resourceType === RESOURCE_ENERGY && s.amount >= minEnergyInObject && s.pos.getRangeTo(creep) <= distanceFromEdge;
      });
      if (targets.length > 0) {
        target = chooseClosest(creep, target);
      }
    } else {
      target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
        filter: function(s) {
          return s.amount >= minEnergyInObject && s.pos.getRangeTo(creep) <= maxRange;
        }
      });
    }
    if (target) {
      return target;
    }
  } else if (withdrawOrTransfer === "withdraw") {
    targets = [];
    if (distanceFromEdge <= 10) {
      targets = creep.room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y - distanceFromEdge, creep.pos.x - distanceFromEdge, creep.pos.y + distanceFromEdge, creep.pos.x + distanceFromEdge, true).filter(function(s) {
        var ref;
        return s.structureType === type && s.store[RESOURCE_ENERGY] >= minEnergyInObject && (ref = s.id, indexOf.call(excludeListIDs, ref) < 0) && s.pos.getRangeTo(creep) <= maxRange;
      });
      if (targets.length > 0) {
        target = chooseClosest(targets);
      }
    } else {
      targets = [];
      ref = Game.rooms;
      for (name in ref) {
        room = ref[name];
        targets = targets.concat(Game.rooms[name].find(FIND_STRUCTURES).filter(function(s) {
          var ref1;
          return s.structureType === type && s.store[RESOURCE_ENERGY] >= minEnergyInObject && (ref1 = s.id, indexOf.call(excludeListIDs, ref1) < 0) && getDistance(creep, s) <= maxRange;
        }));
      }
    }
    if (targets.length > 0) {
      target = chooseClosest(creep, targets);
    }
    if (target) {
      return target;
    }
  } else if (withdrawOrTransfer === "transfer") {
    targets = [];
    if (distanceFromEdge <= 10) {
      targets = creep.room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y - distanceFromEdge, creep.pos.x - distanceFromEdge, creep.pos.y + distanceFromEdge, creep.pos.x + distanceFromEdge, true).filter(function(s) {
        var ref1;
        return s.structureType === type && s.storeCapacity - _.sum(s.store) >= minEnergyInObject && (ref1 = s.id, indexOf.call(excludeListIDs, ref1) < 0) && s.pos.getRangeTo(creep) <= maxRange;
      });
      if (targets.length > 0) {
        target = chooseClosest(creep, targets);
      }
    } else {
      targets = [];
      ref1 = Game.rooms;
      for (name in ref1) {
        room = ref1[name];
        targets = targets.concat(Game.rooms[name].find(FIND_STRUCTURES).filter(function(s) {
          var ref2;
          return s.structureType === type && s.storeCapacity - _.sum(s.store) >= minEnergyInObject && (ref2 = s.id, indexOf.call(excludeListIDs, ref2) < 0) && getDistance(creep, s) <= maxRange;
        }));
      }
    }
    if (targets.length > 0) {
      target = chooseClosest(creep, targets);
    }
    if (target) {
      return target;
    }
  }
};

module.exports = {
  chooseClosest: chooseClosest,
  findEnergy: findEnergy,
  getDistance: getDistance,
  getDistanceInTicks: getDistanceInTicks
};
