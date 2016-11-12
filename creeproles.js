var builder, calculations, chooseClosest, claimer, costEfficientMove, dying, energyRefiller, energyTransporter, fighter, findConstructionSite, findEnergy, findMiningSite, findNearbyDroppedEnergy, findRepairSite, findStructureToDeposit, findStructureToWithdraw, getDistance, getDistanceInTicks, goBuild, goMine, goPickUpEnergy, goRepair, goTransferEnergy, goWithdrawEnergy, harvester, healer, loadDefaultValues, moveOutOfTheWay, repairer, retreat, sourceMiner, upgrader, warrior,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

calculations = require("./calculations");

chooseClosest = calculations.chooseClosest;

findEnergy = calculations.findEnergy;

getDistance = calculations.getDistance;

getDistanceInTicks = calculations.getDistanceInTicks;

loadDefaultValues = function(creep) {
  if (!creep.memory.retreatRoomName) {
    return creep.memory.retreatRoomName = Game.spawns.Spawn1.room.name;
  }
};

findConstructionSite = function(creep, distance) {
  var site, sites, target;
  if (distance == null) {
    distance = 10000;
  }
  if (Memory.structures.buildingSites) {
    sites = (function() {
      var i, len, ref, results;
      ref = Memory.structures.buildingSites;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        site = ref[i];
        results.push(Game.getObjectById(site));
      }
      return results;
    })();
    if (sites) {
      target = chooseClosest(creep, sites);
    }
    if (target) {
      if (getDistance(creep, target) <= distance) {
        return target;
      } else {
        return void 0;
      }
    }
  }
};

findRepairSite = function(creep, distance) {
  var site, sites, target;
  if (distance == null) {
    distance = 100000;
  }
  if (Memory.structures.repairTargets) {
    sites = (function() {
      var i, len, ref, results;
      ref = Memory.structures.repairTargets;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        site = ref[i];
        results.push(Game.getObjectById(site));
      }
      return results;
    })();
    if (sites) {
      target = chooseClosest(creep, sites);
    }
    if (target) {
      if (getDistance(creep, target) <= distance) {
        return target;
      } else {
        return void 0;
      }
    }
  }
};

findNearbyDroppedEnergy = function(creep, distance) {
  var target;
  if (distance) {
    target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
      filter: function(s) {
        return (creep.pos.getRangeTo(s)) <= distance && s.amount >= 20;
      }
    });
    if (target) {
      creep.memory.target = target.id;
      return target;
    }
  } else {
    target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY);
    creep.memory.target = target.id;
    return target;
  }
};

findStructureToWithdraw = function(creep, structureType, distance, minEnergyInObject, excludeListIDs) {
  var target;
  if (structureType == null) {
    structureType = STRUCTURE_CONTAINER;
  }
  if (distance == null) {
    distance = 100000;
  }
  if (minEnergyInObject == null) {
    minEnergyInObject = creep.carryCapacity - creep.carry.energy;
  }
  if (excludeListIDs == null) {
    excludeListIDs = [];
  }
  target = findEnergy(creep, minEnergyInObject, distance, structureType, "withdraw", excludeListIDs);
  if (target) {
    return target;
  }
};

findStructureToDeposit = function(creep, structureType, distance, minEnergyInObject, excludeListIDs) {
  var target;
  if (distance == null) {
    distance = 100000;
  }
  if (minEnergyInObject == null) {
    minEnergyInObject = creep.carry.energy;
  }
  if (excludeListIDs == null) {
    excludeListIDs = [];
  }
  if (!structureType) {
    structureType = STRUCTURE_CONTAINER;
  }
  console.log("findStructureToDeposit", structureType);
  if (structureType === STRUCTURE_TOWER || structureType === STRUCTURE_SPAWN || structureType === STRUCTURE_EXTENSION) {
    target = chooseClosest(creep, creep.room.find(FIND_STRUCTURES, {
      filter: function(s) {
        return s.structureType === structureType && s.energy < s.energyCapacity && creep.pos.getRangeTo(s) <= distance;
      }
    }));
  } else {
    target = findEnergy(creep, minEnergyInObject, distance, structureType, "transfer", excludeListIDs);
  }
  if (target) {
    return target;
  }
};

findMiningSite = function(creep, distance) {
  var target;
  if (distance == null) {
    distance = 10000;
  }
  target = creep.pos.findClosestByPath(FIND_SOURCES, {
    filter: function(s) {
      return (creep.pos.getRangeTo(s)) <= distance;
    }
  });
  if (target) {
    return target;
  }
};

goBuild = function(creep, target) {
  if (target) {
    creep.memory.target = target.id;
    if (target.progress >= 0) {
      if (target.progress < target.progressTotal) {
        if (creep.build(target) === ERR_NOT_IN_RANGE) {
          creep.say("BLD " + target.pos.x + "," + target.pos.y);
          return costEfficientMove(creep, target);
        } else if (creep.carry.energy === 0) {
          return creep.memory.target = void 0;
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
    if (target.hits >= 1) {
      if (target.hits < target.hitsMax * 0.99) {
        if (creep.repair(target) === ERR_NOT_IN_RANGE) {
          creep.say("RPR " + target.pos.x + "," + target.pos.y);
          return costEfficientMove(creep, target);
        } else if (creep.carry.energy === 0) {
          return creep.memory.target = void 0;
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
  var ref;
  if (target) {
    creep.memory.target = target.id;
    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.say("MOVE TRNSFR");
      costEfficientMove(creep, target);
      if ((ref = target.structureType) === STRUCTURE_TOWER || ref === STRUCTURE_SPAWN || ref === STRUCTURE_EXTENSION) {
        if (target.energy === target.energyCapacity) {
          return creep.memory.target = void 0;
        }
      } else {
        if (target.storeCapacity - _.sum(target.store) < creep.carry.energy) {
          return creep.memory.target = void 0;
        }
      }
    } else {
      creep.say("TRANSFER");
      return creep.memory.target = void 0;
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
      if (target.store(RESOURCE_ENERGY) < creep.carryCapacity - creep.carry.energy) {
        return creep.memory.target = void 0;
      }
    } else {
      creep.say("WITHDR E");
      return creep.memory.target = void 0;
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
  if (distance == null) {
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

moveOutOfTheWay = function(creep, distance) {
  var otherCreep;
  if (distance == null) {
    distance = 2;
  }
  otherCreep = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(s) {
      return s !== creep && creep.pos.getRangeTo(s) <= distance;
    }
  });
  if (otherCreep) {
    creep.say("AVOID");
    return creep.move((4 + creep.pos.getDirectionTo(otherCreep) + Math.floor((Math.random() * 3) - 1)) % 8);
  }
};

goMine = function(creep, target) {
  if (target) {
    creep.say("MINING");
    if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
      return costEfficientMove(creep, target);
    }
  } else {
    return console.log("THIS SHOULD NEVER BE REACHED! ERROR IN MINING COMMANDD");
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
  if (!creep.memory.energySourceID) {
    creep.memory.energySourceID = creep.pos.findClosestByRange(FIND_SOURCES).id;
  }
  if (!creep.memory.energySourceRoomName) {
    creep.memory.energySourceRoomName = Game.getObjectById(creep.memory.energySourceID).room.name;
  }
  if (!creep.memory.state) {
    creep.memory.state = "mining";
  }
  if (creep.memory.state === "mining" && creep.carry.energy === creep.carryCapacity) {
    creep.memory.state = "puttingEnergyInContainer";
    creep.memory.target = void 0;
  } else if (creep.memory.state === "puttingEnergyInContainer" && creep.carry.energy === 0) {
    creep.memory.state = "lookingForNearbyEnergy";
    creep.memory.target = void 0;
  } else if (creep.memory.state === "lookingForNearbyEnergy" && creep.carry.energy === 0) {
    creep.memory.state = "mining";
    creep.memory.target = void 0;
  }
  if (!creep.memory.target && creep.memory.state === "mining") {
    creep.memory.target = creep.memory.energySourceID;
  }
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (!target) {
    creep.memory.target = void 0;
  }
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.controller.safeMode) {
    retreat(creep);
    1;
  }
  if (creep.memory.state === "mining") {
    if (!target) {
      if (creep.room.name !== creep.memory.energySourceRoomName) {
        costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.energySourceRoomName));
      } else {
        console.log("minerscript ???????? wat");
      }
    }
    if (target) {
      goMine(creep, target);
    }
  }
  if (creep.memory.state === "puttingEnergyInContainer") {
    console.log(target, creep.memory.target);
    if (!target) {
      console.log("MINER DOWN BELOW:");
      target = findStructureToDeposit(creep, STRUCTURE_CONTAINER, 1);
      console.log("new found structure:", target);
    }
    if (target && !target.progress) {
      if (indexOf.call(Memory.energy.miningContainers, target) < 0) {
        Memory.energy.miningContainers.push(target.id);
      }
      if (_.sum(target.store) < target.storeCapacity) {
        goTransferEnergy(creep, target);
        creep.say("PUT CNTR");
      } else {
        creep.say("CNTR FULL");
        creep.drop(RESOURCE_ENERGY);
      }
    } else {
      if (!target) {
        target = findConstructionSite(creep, 2);
      }
      if (target) {
        goBuild(creep, target);
        creep.say("BLD CNTR");
      } else {
        creep.say("NO CNTR");
        creep.drop(RESOURCE_ENERGY);
      }
    }
  }
  if (creep.memory.state === "lookingForNearbyEnergy") {
    if (findStructureToDeposit(creep, STRUCTURE_CONTAINER, 1) || findConstructionSite(creep, 1)) {
      target = findNearbyDroppedEnergy(creep, 1);
    }
    if (target) {
      goPickUpEnergy(creep, target);
      creep.memory.state = "puttingEnergyInContainer";
      return creep.memory.target = void 0;
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
  if (!target) {
    creep.memory.target = void 0;
  }
  if (!creep.memory.state) {
    creep.memory.state = "pickupEnergy";
  }
  creep.memory.state = 0 === creep.carry.energy ? "pickupEnergy" : "deliverEnergy";
  if (creep.memory.state === "pickupEnergy") {
    if (!target) {
      target = findNearbyDroppedEnergy(creep, 5);
    }
    if (!target) {
      target = findStructureToWithdraw(creep, void 0, void 0, void 0, Memory.energy.miningContainers);
    }
    if (!target) {
      target = findStructureToWithdraw(creep);
    }
    if (!target) {
      target = findNearbyDroppedEnergy(creep, 30);
    }
    if (target) {
      goWithdrawEnergy(creep, target);
    }
  }
  if (creep.memory.state === "deliverEnergy") {
    if (!target) {
      target = findStructureToDeposit(creep, STRUCTURE_EXTENSION);
    }
    if (!target) {
      target = findStructureToDeposit(creep, STRUCTURE_SPAWN);
    }
    if (!target) {
      target = findStructureToDeposit(creep, STRUCTURE_TOWER);
    }
    if (target) {
      goTransferEnergy(creep, target);
    } else {
      moveOutOfTheWay(creep);
    }
  }
  if (creep.memory.state === "dying") {
    return dying(creep);
  }
};

energyTransporter = function(creep) {
  var t1, t2, target;
  loadDefaultValues(creep);
  creep.memory.state = creep.carry.energy === creep.carryCapacity ? "deliverEnergy" : "pickupEnergy";
  if (!creep.memory.energySourceID) {
    console.log(creep.name, creep.role, "has no energy sourceID in memory!");
  }
  if (!creep.memory.state) {
    creep.memory.state = "pickupEnergy";
  }
  if (creep.memory.state === "pickupEnergy" && !creep.memory.target) {
    creep.memory.target = creep.memory.energySourceID;
  }
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (!target) {
    creep.memory.target = void 0;
  }
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.controller.safeMode) {
    retreat(creep);
  }
  if (creep.memory.state === "pickupEnergy") {
    if (target) {
      if (creep.memory.energySourceRoomName !== creep.room.name) {
        costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.energySourceRoomName));
      }
      if (target.id === creep.memory.energySourceID) {
        if (creep.pos.getRangeTo(target) <= 4) {
          target = findNearbyDroppedEnergy(creep, 5);
          if (!target || target.ticksToRegeneration) {
            target = findStructureToWithdraw(creep, STRUCTURE_CONTAINER, 5, void 0, Memory.energy.miningContainers);
          }
          if (target) {
            goWithdrawEnergy(creep, target);
          }
        } else {
          costEfficientMove(creep, target);
        }
      } else {
        if (target) {
          goWithdrawEnergy(creep, target);
        }
      }
    } else {
      console.log(creep.name, creep.pos, creep.memory.target, creep.memory.energySourceID, "programm should never get here, in energyTransporter!");
    }
  }
  if (creep.memory.state === "deliverEnergy") {
    t1 = findStructureToDeposit(creep, STRUCTURE_CONTAINER);
    t2 = findStructureToDeposit(creep, STRUCTURE_STORAGE);
    target = chooseClosest(creep, [t1, t2]);
    if (target && creep.carry.energy) {
      goTransferEnergy(creep, target);
    } else {
      moveOutOfTheWay(creep);
    }
  }
  if (creep.memory.state === "dying") {
    return dying(creep);
  }
};

repairer = function(creep) {
  var target;
  loadDefaultValues(creep);
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (!target) {
    creep.memory.target = void 0;
  }
  creep.memory.state = 0 === creep.carry.energy ? "pickupEnergy" : "repairing";
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.controller.safeMode) {
    retreat(creep);
  }
  if (creep.memory.state === "pickupEnergy") {
    if (!target) {
      target = findNearbyDroppedEnergy(creep, 5);
    }
    if (!target) {
      target = findStructureToWithdraw(creep);
    }
    if (target && !target.amount) {
      goWithdrawEnergy(creep, target);
    }
  }
  if (creep.memory.state === "repairing") {
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
  if (!target) {
    creep.memory.target = void 0;
  }
  creep.memory.state = 0 === creep.carry.energy ? "pickupEnergy" : "building";
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.controller.safeMode) {
    retreat(creep);
  }
  if (creep.memory.state === "pickupEnergy") {
    if (!target) {
      target = findNearbyDroppedEnergy(creep, 5);
    }
    if (!target) {
      target = findStructureToWithdraw(creep);
    }
    if (target && !target.amount) {
      goWithdrawEnergy(creep, target);
    } else {
      moveOutOfTheWay(creep);
    }
  }
  if (creep.memory.state === "building") {
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
  if (!target) {
    creep.memory.target = void 0;
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
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.controller.safeMode) {
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
  var t1, t2, target;
  loadDefaultValues(creep);
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (!target) {
    creep.memory.target = void 0;
  }
  creep.memory.state = 0 === creep.carry.energy ? "pickupEnergy" : "upgrading";
  if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && !creep.room.controller.safeMode) {
    retreat(creep);
  }
  if (creep.memory.state === "pickupEnergy") {
    if (!target) {
      target = findNearbyDroppedEnergy(creep, 5);
    }
    if (!target) {
      t1 = findStructureToWithdraw(creep, STRUCTURE_STORAGE, void 0, 500, Memory.energy.miningContainers);
      t2 = findStructureToWithdraw(creep, STRUCTURE_CONTAINER, void 0, 500, Memory.energy.miningContainers);
      target = chooseClosest(creep, [t1, t2]);
    }
    if (target && !target.amount) {
      goWithdrawEnergy(creep, target);
    } else {
      moveOutOfTheWay(creep);
    }
  }
  if (creep.memory.state === "upgrading") {
    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
      costEfficientMove(creep, creep.room.controller);
    }
  }
  if (creep.memory.state === "dying") {
    return dying(creep);
  }
};

fighter = function(creep) {
  var target;
  loadDefaultValues(creep);
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (!target) {
    creep.memory.target = void 0;
  }
  return console.log("testerinoo");
};


/*
harvester = (creep) ->
    loadDefaultValues(creep)
    creep.memory.state = if creep.carry.energy is creep.carryCapacity then "work"
    creep.memory.state = if creep.carry.energy is 0 then "mine"
    target = Game.getObjectById(creep.memory.target) if creep.memory.target
    creep.memory.target = undefined if !target

    if creep.carry.state is "mine"
        if creep.memory.state is creep.carry.energy
            creep.carry.state = "work"
        if !target
            target = findMiningSite(creep)
        if target
            goMine(creep, target)
    else if creep.carry.state is "work"
        if !target
            target = findStructureToDeposit(creep, STRUCTURE_TOWER)
        if !target
            target = findStructureToDeposit(creep, STRUCTURE_EXTENSION)
            if !target
                target = findStructureToDeposit(creep, STRUCTURE_SPAWN)
        if target
            goTransferEnergy(creep, target)
        else
            moveOutOfTheWay(creep)
 */

harvester = function(creep) {
  var target;
  loadDefaultValues(creep);
  if (!creep.memory.state) {
    creep.memory.state = "mining";
  }
  if (creep.carry.energy === creep.carryCapacity) {
    creep.memory.state = "deliverEnergy";
    creep.memory.target = void 0;
  }
  if (creep.carry.energy === 0) {
    creep.memory.state = "mining";
    creep.memory.target = void 0;
  }
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (!target) {
    creep.memory.target = void 0;
  }
  if (creep.memory.state === "mining") {
    if (!target) {
      target = findNearbyDroppedEnergy(creep, 5);
    }
    if (target && target.amount) {
      goPickUpEnergy(creep, target);
    }
    if (!target) {
      target = findMiningSite(creep);
    }
    if (target && !target.amount) {
      goMine(creep, target);
    }
  }
  if (creep.memory.state === "deliverEnergy") {
    if (!target) {
      target = findStructureToDeposit(creep, STRUCTURE_SPAWN);
    }
    if (target) {
      return goTransferEnergy(creep, target);
    }
  }
};

warrior = function(creep) {
  var attackTarget, linkedCreep, target;
  loadDefaultValues(creep);
  if (creep.memory.isLinked) {
    linkedCreep = Game.getObjectById(creep.memory.linkedCreep);
  }
  if (!linkedCreep) {
    creep.memory.isLinked = void 0;
    creep.memory.linkedCreep = void 0;
  }
  if (creep.memory.isLinked) {
    if (creep.room === creep.memory.attackRoomName) {
      attackTarget = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
      if (!attackTarget) {
        attackTarget = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
          filter: function(s) {
            return s.structureType === STRUCTURE_TOWER || s.structureType === STRUCTURE_RAMPART;
          }
        });
        if (!attackTarget) {
          attackTarget = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
          if (!attackTarget) {
            attackTarget = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
            if (!attackTarget) {
              attackTarget = creep.pos.findClosestByPath(FIND_HOSTILE_CONSTRUCTION_SITES);
            }
          }
        }
      }
      if (attackTarget) {
        if (creep.attack(attackTarget) === ERR_NOT_IN_RANGE) {
          return costEfficientMove(creep, attackTarget);
        }
      } else {
        target = creep.pos.findClosestByPath(FIND_SOURCES);
        if (getdistance(creep, target) >= 5) {
          return costEfficientMove(creep, target);
        } else {
          return moveOutOfTheWay(creep, 2);
        }
      }
    } else if (creep.room !== creep.memory.attackRoomName) {
      return costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.attackRoomName));
    }
  } else if (!creep.memory.isLinked) {
    if (creep.room.name !== creep.memory.retreatRoomName) {
      return moveTo(new RoomPosition(25, 25, creep.memory.retreatRoomName));
    } else {
      return moveOutOfTheWay(creep);
    }
  }
};

healer = function(creep) {
  var healTarget, highestPriority, linkedCreep, needHealing;
  loadDefaultValues(creep);
  if (creep.memory.isLinked) {
    linkedCreep = Game.getObjectById(creep.memory.linkedCreep);
  }
  if (!linkedCreep) {
    creep.memory.isLinked = void 0;
    creep.memory.linkedCreep = void 0;
  }
  if (creep.memory.isLinked) {
    if (creep.hits < creep.hitsMax || linkedCreep.hits < linkedCreep.hitsMax) {
      needHealing = true;
    }
    highestPriority = creep.hits / creep.hitsMax < linkedCreep.hits / linkedCreep.hitsMax ? creep : linkedCreep;
    if (highestPriority === linkedCreep) {
      if (creep.heal(linkedCreep) === ERR_NOT_IN_RANGE) {
        return costEfficientMove(creep, linkedCreep);
      } else if (creep.heal(linkedCreep) === ERR_NO_BODYPART) {
        return creep.heal(creep);
      }
    } else if (highestPriority === creep) {
      return creep.heal(creep);
    } else {
      return costEfficientMove(creep, linkedCreep);
    }
  } else if (!creep.memory.isLinked) {
    linkedCreep = creep.room.find(FIND_MY_CREEPS, {
      filter: function(s) {
        return s.memory.role === "warrior" && !s.memory.isLinked;
      }
    });
    if (!linkedCreep.memory.isLinked) {
      creep.say("LINK " + linkedCreep.pos.x + " " + linkedCreep.pos.y);
      linkedCreep.say("LINK " + creep.pos.x + " " + creep.pos.y);
      creep.memory.isLinked = true;
      creep.memory.linkedCreep = linkedCreep.id;
      linkedCreep.memory.isLinked = true;
      return linkedCreep.memory.linkedCreep = creep.id;
    } else if (creep.room.name !== creep.memory.retreatRoomName) {
      if (moveTo(new RoomPosition(25, 25, creep.memory.retreatRoomName)) === ERR_NO_BODYPART) {
        return creep.heal(creep);
      }
    } else if (creep.room.name === creep.memory.retreatRoomName) {
      healTarget = creep.room.find(FIND_MY_CREEPS, {
        filter: function(s) {
          return s.hits < s.hitsMax;
        }
      });
      if (healTarget) {
        if (creep.heal(healTarget) === ERR_NOT_IN_RANGE) {
          return costEfficientMove(creep, healTarget);
        }
      }
    }
  }
};


/*
asd
 */

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
  harvester: harvester,
  sourceMiner: sourceMiner,
  energyRefiller: energyRefiller,
  energyTransporter: energyTransporter,
  repairer: repairer,
  builder: builder,
  claimer: claimer,
  upgrader: upgrader,
  fighter: fighter,
  warrior: warrior,
  healer: healer
};
