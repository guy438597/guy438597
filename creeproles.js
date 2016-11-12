var calculations, chooseClosest, findEnergy, getDistance, getDistanceInTicks, harvester, loadDefaultValues;

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

harvester = function(creep) {
  var target;
  loadDefaultValues(creep);
  if (!creep.memory.state) {
    creep.memory.state = "mining";
  }
  creep.memory.state = creep.carry.energy === creep.carryCapacity ? "deliverEnergy" : void 0;
  creep.memory.state = creep.carry.energy === 0 ? "mining" : void 0;
  if (creep.memory.target) {
    target = Game.getObjectById(creep.memory.target);
  }
  if (creep.memory.state === "mining") {
    if (!target) {
      target = findNearbyDroppedEnergy(creep, 5);
    }
    if (target && target.amount) {
      pickupEnergy(creep, target);
    }
    if (!target) {
      target = findMiningSite(creep);
    }
    if (target && !target.amount) {
      return goMine(creep, target);
    }
  } else if (creep.memory.state === "deliverEnergy") {
    if (!target) {
      target = creep.room.find(FIND_STRUCTURES, {
        filter: function(s) {
          return s.structureType === STRUCTURE_SPAWN;
        }
      });
    }
    if (target) {
      return goTransferEnergy(creep, target);
    }
  }
};

module.exports.loadDefaultValues = loadDefaultValues;

module.exports.harvester = harvester;
