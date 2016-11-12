var builder, calculations, chooseClosest, claimer, costEfficientMove, dying, energyRefiller, energyTransporter, fighter, findConstructionSite, findEnergy, findMiningSite, findNearbyDroppedEnergy, findRepairSite, findStructureToDeposit, findStructureToWithdraw, getDistance, getDistanceInTicks, goBuild, goMine, goPickUpEnergy, goRepair, goTransferEnergy, goWithdrawEnergy, harvester, loadDefaultValues, moveOutOfTheWay, repairer, retreat, sourceMiner, upgrader,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

calculations = require("./calculations");

chooseClosest = calculations.chooseClosest;

findEnergy = calculations.findEnergy;

getDistance = calculations.getDistance;

getDistanceInTicks = calculations.getDistanceInTicks;

loadDefaultValues = function(creep) {
  if (!creep.memory.retreatRoomName) {
    creep.memory.retreatRoomName = Game.spawns.Spawn1.room.name;
  }
  return 0;
};

findConstructionSite = function(creep, distance) {
  var target;
  if (!distance) {
    distance = 10000;
  }
  if (Memory.structures.buildingSites) {
    target = chooseClosest((function() {
      var i, len, ref, results;
      ref = Memory.structures.buildingSites;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        target = ref[i];
        results.push(Game.getObjectById(target));
      }
      return results;
    })());
    return target;
  }
};

findRepairSite = function(creep, distance) {
  var target;
  if (!distance) {
    distance = 10000;
  }
  if (Memory.structures.repairTargets) {
    target = chooseClosest((function() {
      var i, len, ref, results;
      ref = Memory.structures.repairTargets;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        target = ref[i];
        results.push(Game.getObjectById(target));
      }
      return results;
    })());
    return target;
  }
};

findNearbyDroppedEnergy = function(creep, distance) {
  var filter, target;
  if (distance) {
    target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, filter = function(s) {
      return creep.pos.getRangeTo(s.pos) <= distance;
    });
    if (target) {
      creep.memory.target = target.id;
      return target;
    }
  } else {
    target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
    creep.memory.target = target.id;
    return target;
  }
};

findStructureToWithdraw = function(creep, structureType, distance, energy, excludeListIDs) {
  var target;
  if (structureType == null) {
    structureType = STRUCTURE_CONTAINER;
  }
  if (distance == null) {
    distance = 100000;
  }
  if (energy == null) {
    energy = creep.carryCapacity - creep.carry.energy;
  }
  if (excludeListIDs == null) {
    excludeListIDs = [];
  }
  target = findEnergy(creep, energy, distance, structureType, "withdraw", excludeListIDs);
  if (target) {
    return target;
  }
};

findStructureToDeposit = function(creep, structureType, distance, energy, excludeListIDs) {
  var filter, target;
  if (distance == null) {
    distance = 100000;
  }
  if (energy == null) {
    energy = creep.carry.energy;
  }
  if (excludeListIDs == null) {
    excludeListIDs = [];
  }
  if (!structureType) {
    structureType = STRUCTURE_CONTAINER;
  }
  if (structureType === STRUCTURE_TOWER || structureType === STRUCTURE_SPAWN || structureType === STRUCTURE_EXTENSION) {
    target = chooseClosest(creep, creep.room.find(FIND_STRUCTURES, filter = function(s) {
      return s.structureType === structureType && s.energy < s.energyCapacity && creep.pos.getRangeTo(s.pos) <= distance;
    }));
  } else {
    target = findEnergy(creep, energy, distance, structureType, "transfer", excludeListIDs);
  }
  if (target) {
    return target;
  }
};

findMiningSite = function(creep, distance) {
  var filter, target;
  if (!distance) {
    distance = 10000;
  }
  target = creep.pos.findClosestByPath(FIND_SOURCES, filter = function(s) {
    return creep.pos.getRangeTo(s.pos) <= distance;
  });
  return target;
};

goBuild = function(creep, target) {
  if (target) {
    creep.memory.target = target.id;
    if (target.progress) {
      if (target.progress < target.progressTotal) {
        if (creep.repair(target) === ERR_NOT_IN_RANGE) {
          creep.say("RPR " + target.pos.x + "," + target.pos.y);
          return costEfficientMove(creep, target);
        }
      } else {
        return creep.memory.target = void 0;
      }
    } else {
      return creep.memory.target = void 0;
    }
  }
};

goRepair = function(creep, target) {
  if (target) {
    creep.memory.target = target.id;
    if (target.hits) {
      if (target.hits < target.hitsMax * 0.99) {
        if (creep.build(target) === ERR_NOT_IN_RANGE) {
          creep.say("BLD " + target.pos.x + "," + target.pos.y);
          return costEfficientMove(creep, target);
        }
      } else {
        return creep.memory.target = void 0;
      }
    } else {
      return creep.memory.target = void 0;
    }
  }
};

goTransferEnergy = function(creep, target) {
  if (target) {
    creep.memory.target = target.id;
    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.say("MOVE TRNSFR");
      return costEfficientMove(creep, target);
    } else {
      return creep.say("TRANSFER");
    }
  }
};

goWithdrawEnergy = function(creep, target) {
  if (target) {
    creep.memory.target = target.id;
    if (!target.storeCapacity) {
      return goPickUpEnergy(creep, target);
    } else if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.say("MOVE WITHDRAW");
      costEfficientMove(creep, target);
      creep.memory.target = target.id;
      return 1;
    } else {
      creep.say("WITHDR E");
      creep.memory.target = void 0;
      return 1;
    }
  } else {
    creep.memory.target = void 0;
    return -1;
  }
};

goPickUpEnergy = function(creep, target) {
  if (target) {
    creep.memory.target = target.id;
    if (target.storeCapacity) {
      return goWithdrawEnergy(creep, target);
    } else if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
      creep.say("MOVE PICKUP");
      costEfficientMove(creep, target);
      creep.memory.target = target.id;
      return 1;
    } else {
      creep.say("PICKUP E");
      creep.memory.target = void 0;
      return 1;
    }
  } else {
    creep.memory.target = void 0;
    return -1;
  }
};

retreat = function(creep, distance) {
  if (!distance) {
    distance = 2;
  }
  creep.say("RETREAT");
  return costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.retreatRoomName));
};

costEfficientMove = function(creep, target) {
  if (target) {
    if (creep.moveTo(target, {
      noPathFinding: false
    }) === ERR_NOT_FOUND) {
      return creep.moveTo(target);
    }
  }
};

moveOutOfTheWay = function(creep) {
  var filter, otherCreep;
  otherCreep = creep.pos.findClosestByRange(FIND_MY_CREEPS, filter = function(s) {
    return s !== creep && creep.pos.getRangeTo(s) <= 2;
  });
  if (otherCreep) {
    creep.say("AVOID");
    return creep.move((4 + creep.pos.getDirectionTo(otherCreep) + Math.floor((Math.random() * 3) - 1)) % 8);
  }
};

goMine = function(creep, target) {
  if (target) {
    if (creep.memory.energySourceRoomName !== creep.room.name) {
      creep.say("MINE " + creep.memory.energySourceRoom);
      return costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.energySourceRoomName));
    } else {
      creep.say("MINING");
      if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
        return costEfficientMove(creep, target);
      }
    }
  } else {
    return console.log("THIS SHOULD NEVER BE REACHED! ERROR IN MINING COMMAND");
  }
};

dying = function(creep) {
  var t1, t2, target;
  if (creep.carry.energy > 0) {
    if (!target) {
      t1 = findStructureToDeposit(creep, STRUCTURE_CONTAINER);
      t2 = findStructureToDeposit(creep, STRUCTURE_STORAGE);
      target = chooseClosest(creep, [t1, t2]);
    }
    if (target && creep.carry.energy) {
      return goTransferEnergy(creep, target);
    } else {
      return moveOutOfTheWay(creep);
    }
  } else {
    return moveOutOfTheWay(creep);
  }
};

sourceMiner = function(creep) {
  var target;
  loadDefaultValues(creep);
  if (!creep.memory.energySource) {
    creep.memory.energySource = creep.pos.findClosestByRange(FIND_SOURCES).id;
  }
  if (!creep.memory.energySourceRoomName) {
    creep.memory.energySourceRoomName = Game.getObjectById(creep.memory.energySource).room.name;
  }
  if (!creep.memory.state) {
    creep.memory.state = "mining";
  }
  if (!creep.memory.target && creep.memory.state === "mining") {
    creep.memory.target = creep.memory.energySource;
  }
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.safeMode) {
    return retreat(creep);
  } else if (creep.memory.state === "mining") {
    if (!target) {
      console.log("CREEP SHOULD NEVER HAVE NO TARGET, ERROR IN MINER SCRIPT");
      findMiningSite(creep);
    }
    if (target) {
      return goMine(creep, target);
    }
  } else if (creep.memory.state === "puttingEnergyInContainer") {
    if (!target) {
      target = findStructureToDeposit(creep, STRUCTURE_CONTAINER, 2);
    }
    if (target) {
      if (indexOf.call(Memory.energy.miningContainers, target) < 0) {
        Memory.energy.miningContainers.push(target.id);
      }
      if (_.sum(target.store) < target.storeCapacity) {
        goTransferEnergy(creep, target);
        return creep.say("PUT CNTR");
      } else {
        creep.say("CNTR FULL");
        creep.drop(RESOURCE_ENERGY);
        return creep.memory.state = "mining";
      }
    } else {
      if (!target) {
        target = findConstructionSite(creep, 2);
      }
      if (target) {
        goBuild(creep, target);
        return creep.say("BLD CNTR");
      } else {
        creep.say("NO CNTR");
        creep.drop(RESOURCE_ENERGY);
        return creep.memory.state = "mining";
      }
    }
  } else if (creep.memory.state === "lookingForNearbyEnergy") {
    if (!target) {
      findNearbyDroppedEnergy(creep, distance);
    }
    if (target) {
      return goPickUpEnergy(creep, target);
    } else {
      return creep.memory.state = "mining";
    }
  }
};

energyRefiller = function(creep) {
  var target;
  loadDefaultValues(creep);
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (!creep.memory.state) {
    creep.memory.state = "pickupEnergy";
  }
  creep.memory.state = 0 === creep.carry.energy ? "pickupEnergy" : "deliverEnergy";
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.safeMode) {
    return retreat(creep);
  } else if (creep.memory.state === "pickupEnergy") {
    if (!target) {
      target = findNearbyDroppedEnergy(creep, 5);
    }
    if (!target) {
      target = findStructureToWithdraw(creep, void 0, void 0, void 0, Memory.energy.miningContainers);
    }
    if (!target) {
      target = findStructureToWithdraw(creep);
      if (target.store[RESOURCE_ENERGY] < creep.carryCapacity - creep.carry.energy) {
        creep.memory.target = void 0;
      }
    }
    if (target) {
      return goWithdrawEnergy(creep, target);
    }
  } else if (creep.memory.state === "deliverEnergy") {
    if (!target) {
      target = findStructureToDeposit(creep, STRUCTURE_EXTENSION);
    }
    if (!target) {
      target = findStructureToDeposit(creep, STRUCTURE_SPAWN);
      if (!target) {
        target = findStructureToDeposit(creep, STRUCTURE_TOWER);
      }
    }
    if (target) {
      goTransferEnergy(creep, target);
      if (target.energyCapacity === target.energy) {
        return creep.memory.target = void 0;
      }
    } else {
      return moveOutOfTheWay(creep);
    }
  } else if (creep.memory.state === "dying") {
    return dying(creep);
  }
};

energyTransporter = function(creep) {
  var t1, t2, target;
  loadDefaultValues(creep);
  creep.memory.state = creep.carry.energy === creep.carryCapacity ? "deliverEnergy" : "pickupEnergy";
  if (!creep.memory.source) {
    console.log(creep.name, creep.role, "has no energy sourceID in memory!");
  }
  if (creep.memory.state === "pickupEnergy" && !creep.memory.target) {
    creep.memory.target = creep.memory.source;
  }
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.safeMode) {
    return retreat(creep);
  } else if (creep.memory.state === "pickupEnergy") {
    if (target) {
      if (creep.memory.energySourceRoomName !== creep.room.name) {
        return costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.energySourceRoomName));
      } else if (creep.pos.getRangeTo(target) <= 5) {
        target = findNearbyDroppedEnergy(creep, 5);
        if (!target) {
          target = findStructureToWithdraw(creep);
        }
        if (target) {
          goWithdrawEnergy(creep, target);
          if (target.store[RESOURCE_ENERGY] < creep.carryCapacity - creep.carry.energy) {
            return creep.memory.target = void 0;
          }
        }
      }
    } else {
      return console.log(creep.name, creep.pos, creep.target, creep.memory.source, "programm should never get here, in energyTransporter!");
    }
  } else if (creep.memory.state === "deliverEnergy") {
    t1 = findStructureToDeposit(creep, STRUCTURE_CONTAINER);
    t2 = findStructureToDeposit(creep, STRUCTURE_STORAGE);
    target = chooseClosest(creep, [t1, t2]);
    if (target && creep.carry.energy) {
      goTransferEnergy(creep, target);
      if (target.storeCapacity - target.store[RESOURCE_ENERGY] > creep.carryCapacity) {
        return creep.memory.target = void 0;
      }
    } else {
      return moveOutOfTheWay(creep);
    }
  } else if (creep.memory.state === "dying") {
    return dying(creep);
  }
};

repairer = function(creep) {
  var target;
  loadDefaultValues(creep);
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.safeMode) {
    return retreat(creep);
  } else if (creep.memory.state === "pickupEnergy") {
    if (!target) {
      target = findNearbyDroppedEnergy(creep, 5);
    }
    if (!target) {
      target = findStructureToWithdraw(creep);
    }
    if (target) {
      return goWithdrawEnergy(creep, target);
    }
  } else if (creep.memory.state === "repairing") {
    if (target) {
      findRepairSite(creep);
    }
    if (!target) {
      return goRepair(creep, target);
    } else {
      return moveOutOfTheWay(creep);
    }
  }
};

builder = function(creep) {
  var target;
  loadDefaultValues(creep);
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.safeMode) {
    return retreat(creep);
  } else if (creep.memory.state === "pickupEnergy") {
    if (!target) {
      target = findNearbyDroppedEnergy(creep, 5);
    }
    if (!target) {
      target = findStructureToWithdraw(creep);
    }
    if (target) {
      return goWithdrawEnergy(creep, target);
    } else {
      return moveOutOfTheWay(creep);
    }
  } else if (creep.memory.state === "building") {
    if (target) {
      findRepairSite(creep);
    }
    if (!target) {
      return goRepair(creep, target);
    } else {
      return moveOutOfTheWay(creep);
    }
  }
};

claimer = function(creep) {
  var target;
  loadDefaultValues(creep);
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (!creep.memory.claimRoomName) {
    creep.memory.claimRoomName = Game.spawns.Spawn1.room.name;
  }
  if (!creep.memory.retreatRoom) {
    creep.memory.retreatRoom = Game.spawns.Spawn1.room.name;
  }
  if (!creep.memory.claimOption) {
    creep.memory.claimOption = "r";
  }
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.safeMode) {
    return retreat(creep);
  } else if (creep.room.name !== creep.memory.claimRoomName) {
    creep.say("CLAIMER");
    return costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.claimRoomName));
  } else if (creep.memory.claimOption === "r") {
    if (creep.room.controller) {
      creep.say("Rsv " + creep.memory.claimRoomName);
      if (creep.reserveController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        return costEfficientMove(creep, creep.room.controller);
      }
    }
  } else if (creep.memory.claimOption === "c") {
    if (creep.room.controller) {
      creep.say("Clm " + creep.memory.claimRoomName);
      if (creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        return costEfficientMove(creep, creep.room.controller);
      }
    }
  } else {
    return moveOutOfTheWay(creep);
  }
};

upgrader = function(creep) {
  var target;
  loadDefaultValues(creep);
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.safeMode) {
    return retreat(creep);
  } else if (creep.memory.state === "pickupEnergy") {
    if (!target) {
      target = findNearbyDroppedEnergy(creep, 5);
    }
    if (!target) {
      target = findStructureToWithdraw(creep);
    }
    if (target) {
      return goWithdrawEnergy(creep, target);
    } else {
      return moveOutOfTheWay(creep);
    }
  } else if (creep.memory.state === "upgrading") {
    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
      return costEfficientMove(creep, creep.room.controller);
    }
  } else if (creep.memory.state === "dying") {
    return dying(creep);
  }
};

fighter = function(creep) {
  var target;
  loadDefaultValues(creep);
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  return console.log("testerinoo");
};

harvester = function(creep) {
  var target;
  loadDefaultValues(creep);
  creep.carry.state = !creep.memory.state && creep.carry.energy === 0 ? "mine" : "work";
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (creep.carry.state === "mine") {
    target = findMiningSite(creep);
    if (target) {
      return goMine(creep, target);
    }
  } else if (creep.carry.state === "work") {
    if (!target) {
      target = findStructureToDeposit(creep, STRUCTURE_TOWER);
    }
    if (!target) {
      target = findStructureToDeposit(creep, STRUCTURE_EXTENSION);
      if (!target) {
        target = findStructureToDeposit(creep, STRUCTURE_SPAWN);
      }
    }
    if (target) {
      return goTransferEnergy(creep, target);
    } else {
      return moveOutOfTheWay(creep);
    }
  }
};

module.exports = {
  loadDefaultValues: loadDefaultValues,
  findConstructionSite: findConstructionSite,
  findRepairSite: findRepairSite,
  findNearbyDroppedEnergy: findNearbyDroppedEnergy,
  findStructureToWithdraw: findStructureToWithdraw,
  findStructureToDeposit: findStructureToDeposit,
  findMiningSite: findMiningSite,
  goBuild: goBuild,
  goRepair: goRepair,
  goTransferEnergy: goTransferEnergy,
  goWithdrawEnergy: goWithdrawEnergy,
  goPickUpEnergy: goPickUpEnergy,
  retreat: retreat,
  costEfficientMove: costEfficientMove,
  moveOutOfTheWay: moveOutOfTheWay,
  goMine: goMine,
  dying: dying,
  sourceMiner: sourceMiner,
  energyRefiller: energyRefiller,
  energyTransporter: energyTransporter,
  repairer: repairer,
  builder: builder,
  claimer: claimer,
  upgrader: upgrader,
  fighter: fighter,
  harvester: harvester
};


/*
loadDefaultValues
findConstructionSite
findRepairSite
findNearbyDroppedEnergy
findStructureToWithdraw
findStructureToDeposit
findMiningSite
goBuild
goRepair
goTransferEnergy
goWithdrawEnergy
goPickUpEnergy
retreat
costEfficientMove
moveOutOfTheWay
goMine
dying
sourceMiner
energyRefiller
energyTransporter
repairer
builder
claimer
upgrader
fighter
harvester
 */
