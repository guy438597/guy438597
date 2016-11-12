var calculations, chooseClosest, findEnergy, getDistance, getDistanceInTicks, runRoles,
  modulo = function(a, b) { return (+a % (b = +b) + b) % b; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

require('./spawnV2')();

calculations = require("./calculations");

chooseClosest = calculations.chooseClosest;

findEnergy = calculations.findEnergy;

getDistance = calculations.getDistance;

getDistanceInTicks = calculations.getDistanceInTicks;

runRoles = require("./creeproles");

module.exports.loop = function() {
  var attackTarget, basicEconomyRunning, c, closestContainer, closestStorage, combinedTicksEnergyRefiller, countBodyParts, countWalkableTiles, creep, energy, energyMax, energySource, energyTransporterConstant, healTarget, i, item, j, k, key, l, len, len1, len10, len11, len12, len2, len3, len4, len5, len6, len7, len8, len9, loc, location, m, maxBodyParts, maxMiners, miner, minimumNumberOfBuilders, minimumNumberOfEnergyRefillers, minimumNumberOfRepairers, minimumNumberOfUpgraders, moreMinersRequired, name, newClaimerRequired, newbuildingSites, newrepairTargets, o, p, q, r, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, repairTarget, results, roleCnt, room, roomName, site, source, sourceID, sourceRoomName, spawnHighPriorityDefense, spawnLowPriorityWarrior, spawning, t, target, tempDistance, totalEnergyTransportersRequired, tower, towers, u, username, v, w, x, y, z;
  ref = Memory.creeps;
  for (name in ref) {
    creep = ref[name];
    if (Game.creeps[name] === void 0) {
      delete Memory.creeps[name];
    }
  }
  energyTransporterConstant = 15;
  minimumNumberOfUpgraders = 7;
  spawnHighPriorityDefense = false;
  spawnLowPriorityWarrior = false;
  if (!Memory.structures) {
    Memory.structures = {};
  }
  Memory.structures.repairFactor = 0.75;
  if (!Memory.energy) {
    Memory.energy = {};
  }
  if (!Memory.energy.miningContainers) {
    Memory.energy.miningContainers = [];
  }
  Memory.energy.energySources = [["57ef9d2186f108ae6e60d4c4", 2, 5, "W48S61"], ["57ef9d2186f108ae6e60d4c2", 3, 5, "W48S61"]];
  if (!Memory.claims) {
    Memory.claims = {};
  }
  Memory.claims.claimLocations = [];
  if (!Memory.energy.energySourceMiners) {
    Memory.energy.energySourceMiners = [];
  }
  while (Memory.energy.energySourceMiners.length < Memory.energy.energySources.length) {
    Memory.energy.energySourceMiners.push([]);
  }
  ref1 = Memory.energy.energySourceMiners;
  for (i = k = 0, len = ref1.length; k < len; i = ++k) {
    name = ref1[i];
    Memory.energy.energySourceMiners[i] = Memory.energy.energySourceMiners[i].filter(function(name) {
      return Game.creeps[name];
    });
  }
  if (!Memory.structures.buildingSites) {
    Memory.structures.buildingSites = [];
  }
  if (!Memory.structures.repairTargets) {
    Memory.structures.repairTargets = [];
  }
  minimumNumberOfBuilders = Math.min(Math.floor((Memory.structures.buildingSites.length + 4) / 5), 3);
  minimumNumberOfRepairers = Math.min(Math.floor((Memory.structures.repairTargets.length + 9) / 10), 3);

  /*
  console.log Memory.structures.buildingSites.length
  console.log Memory.structures.repairTargets.length
  console.log Memory.energy.energySourceMiners.length
  console.log Memory.energy.energySources.length
  console.log Memory.energy.energySourceMiners[1].length
  console.log Memory.claims.claimClaimers.length
  console.log Memory.claims.claimLocations.length
   */
  Memory.energy.miningContainers = Memory.energy.miningContainers.filter(function(id) {
    return !Game.getObjectById(id);
  });
  moreMinersRequired = false;
  ref2 = Memory.energy.energySources;
  for (i = l = 0, len1 = ref2.length; l < len1; i = ++l) {
    source = ref2[i];
    maxMiners = source[1];
    maxBodyParts = source[2];
    countBodyParts = 0;
    ref3 = Memory.energy.energySourceMiners[i];
    for (m = 0, len2 = ref3.length; m < len2; m++) {
      name = ref3[m];
      countBodyParts += Game.creeps[name].getActiveBodyparts(WORK);
    }
    if (Memory.energy.energySourceMiners[i].length < maxMiners && countBodyParts < maxBodyParts) {
      moreMinersRequired = true;
    }
  }
  if (!Memory.claims.claimClaimers) {
    Memory.claims.claimClaimers = [];
  }
  while (Memory.claims.claimClaimers.length < Memory.claims.claimLocations.length) {
    Memory.claims.claimClaimers.push([]);
  }
  ref4 = Memory.claims.claimClaimers;
  for (i = o = 0, len3 = ref4.length; o < len3; i = ++o) {
    name = ref4[i];
    Memory.claims.claimClaimers = Memory.claims.claimClaimers.filter(function(name) {
      return Game.creeps[name];
    });
  }
  newClaimerRequired = false;
  if (!Memory.claims.claimLocations) {
    Memory.claims.claimLocations = [];
  }
  ref5 = Memory.claims.claimLocations;
  for (i = p = 0, len4 = ref5.length; p < len4; i = ++p) {
    location = ref5[i];
    roomName = location[0];
    if (Game.rooms[roomName]) {
      if (Game.rooms[roomName].controller.my) {
        if (!Game.rooms[roomName].controller.reservation || Game.rooms[roomName].controller.reservation.username === "Burny" && Game.rooms[roomName].controller.reservation.ticksToEnd < 200) {
          c = Game.rooms[roomName].controller.pos;
          countWalkableTiles = Game.rooms[roomName].lookAtArea(c.y - 1, c.x - 1, c.y + 1, c.x + 1, true).filter(function(s) {
            return s.type === "terrain" && (s.terrain === "swamp" || s.terrain === "normal");
          });
          if (countWalkableTiles) {
            if (Memory.claims.claimClaimers[i].length < countWalkableTiles.length) {
              newClaimerRequired = true;
            }
          }
        }
      }
    } else {
      newClaimerRequired = true;
    }
  }
  spawning = Game.spawns.Spawn1.spawning !== null;
  energy = Game.spawns.Spawn1.room.energyAvailable;
  energyMax = Game.spawns.Spawn1.room.energyCapacityAvailable;
  minimumNumberOfEnergyRefillers = Math.floor(energyMax / 300);
  towers = Game.spawns.Spawn1.room.find(FIND_STRUCTURES);
  towers = towers.filter(function(s) {
    return s.structureType === STRUCTURE_TOWER;
  });
  for (q = 0, len5 = towers.length; q < len5; q++) {
    tower = towers[q];
    attackTarget = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: function(s) {
        return s.getActiveBodyparts(HEAL) > 0;
      }
    });
    if (!attackTarget) {
      attackTarget = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    }
    if (attackTarget) {
      username = attackTarget.owner.username;
      Game.notify("User", username, "spotted in rooom", tower.room.name);
      tower.attack(attackTarget);
    } else {
      healTarget = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
        filter: function(s) {
          return s.hits < s.hitsMax;
        }
      });
      if (healTarget) {
        tower.heal(healTarget);
      } else {
        repairTarget = tower.pos.findClosestByRange(FIND_MY_STRUCTURES, {
          filter: function(s) {
            return s.hits < s.hitsMax * 0.75;
          }
        });
        if (!repairTarget) {
          repairTarget = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: function(s) {
              return s.hits < s.hitsMax * 0.75 && s.structureType === STRUCTURE_CONTAINER;
            }
          });
        }
        if (repairTarget) {
          tower.repair(repairTarget);
        }
      }
    }
  }
  if (modulo(Game.time, 5) === 0) {
    Memory.structures.repairTargets = [];
    Memory.structures.buildingSites = [];
    ref6 = Game.rooms;
    for (name in ref6) {
      room = ref6[name];
      newrepairTargets = room.find(FIND_STRUCTURES, {
        filter: function(s) {
          return (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER || s.my) && s.hits < s.hitsMax * Memory.structures.repairFactor;
        }
      });
      newbuildingSites = room.find(FIND_MY_CONSTRUCTION_SITES);
      Memory.structures.repairTargets = Memory.structures.repairTargets.concat((function() {
        var len6, r, ref7, results;
        results = [];
        for (r = 0, len6 = newrepairTargets.length; r < len6; r++) {
          site = newrepairTargets[r];
          if (ref7 = site.id, indexOf.call(Memory.structures.repairTargets, ref7) < 0) {
            results.push(site.id);
          }
        }
        return results;
      })());
      Memory.structures.buildingSites = Memory.structures.buildingSites.concat((function() {
        var len6, r, ref7, results;
        results = [];
        for (r = 0, len6 = newbuildingSites.length; r < len6; r++) {
          site = newbuildingSites[r];
          if (ref7 = site.id, indexOf.call(Memory.structures.buildingSites, ref7) < 0) {
            results.push(site.id);
          }
        }
        return results;
      })());
    }
  } else {
    if (Memory.structures.repairTargets) {
      Memory.structures.repairTargets = Memory.structures.repairTargets.filter(function(s) {
        return Game.getObjectById(s) !== null;
      });
    }
    if (Memory.structures.buildingSites) {
      Memory.structures.buildingSites = Memory.structures.buildingSites.filter(function(s) {
        return Game.getObjectById(s) !== null;
      });
    }
  }
  roleCnt = {
    sourceMiner: ((function() {
      var ref7, results;
      ref7 = Game.creeps;
      results = [];
      for (key in ref7) {
        item = ref7[key];
        if (item.memory.role === "sourceMiner") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    energyRefiller: ((function() {
      var ref7, results;
      ref7 = Game.creeps;
      results = [];
      for (key in ref7) {
        item = ref7[key];
        if (item.memory.role === "energyRefiller") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    energyTransporter: ((function() {
      var ref7, results;
      ref7 = Game.creeps;
      results = [];
      for (key in ref7) {
        item = ref7[key];
        if (item.memory.role === "energyTransporter") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    harvester: ((function() {
      var ref7, results;
      ref7 = Game.creeps;
      results = [];
      for (key in ref7) {
        item = ref7[key];
        if (item.memory.role === "harvester") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    builder: ((function() {
      var ref7, results;
      ref7 = Game.creeps;
      results = [];
      for (key in ref7) {
        item = ref7[key];
        if (item.memory.role === "builder") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    repairer: ((function() {
      var ref7, results;
      ref7 = Game.creeps;
      results = [];
      for (key in ref7) {
        item = ref7[key];
        if (item.memory.role === "repairer") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    wallRepairer: ((function() {
      var ref7, results;
      ref7 = Game.creeps;
      results = [];
      for (key in ref7) {
        item = ref7[key];
        if (item.memory.role === "wallRepairer") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    upgrader: ((function() {
      var ref7, results;
      ref7 = Game.creeps;
      results = [];
      for (key in ref7) {
        item = ref7[key];
        if (item.memory.role === "upgrader") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    claimer: ((function() {
      var ref7, results;
      ref7 = Game.creeps;
      results = [];
      for (key in ref7) {
        item = ref7[key];
        if (item.memory.role === "claimer") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    fighter: ((function() {
      var ref7, results;
      ref7 = Game.creeps;
      results = [];
      for (key in ref7) {
        item = ref7[key];
        if (item.memory.role === "fighter") {
          results.push(item);
        }
      }
      return results;
    })()).length
  };
  combinedTicksEnergyRefiller = 0;
  ref7 = Game.creeps;
  for (name in ref7) {
    creep = ref7[name];
    if (Game.creeps[name].spawning) {
      continue;
    }
    if (creep.memory.role === "harvester") {
      if (roleCnt["sourceMiner"] > 1 && roleCnt["energyRefiller"] > 1 && roleCnt["energyTransporter"] > 1) {
        creep.suicide();
      }
    } else if (creep.memory.role === "energyRefiller") {
      combinedTicksEnergyRefiller += creep.ticksToLive;
    }
    runRoles[creep.memory.role](creep);
  }
  if (!Memory.energy.energySourceTransporters) {
    Memory.energy.energySourceTransporters = [];
  }
  while (Memory.energy.energySourceTransporters.length < Memory.energy.energySources.length) {
    Memory.energy.energySourceTransporters.push([]);
  }
  ref8 = Memory.energy.energySourceTransporters[i];
  for (i = r = 0, len6 = ref8.length; r < len6; i = ++r) {
    name = ref8[i];
    Memory.energy.energySourceTransporters[i] = Memory.energy.energySourceTransporters[i].filter(function(n) {
      return Game.creeps[n] && n > 0;
    });
  }
  if (Memory.energy.totalEnergyTransportersRequired === void 0) {
    Memory.energy.totalEnergyTransportersRequired = 0;
  }
  if (!(Game.time % 30)) {
    totalEnergyTransportersRequired = 0;
    ref9 = Memory.energy.energySources;
    for (i = t = 0, len7 = ref9.length; t < len7; i = ++t) {
      energySource = ref9[i];
      source = Game.getObjectById(energySource[0]);
      if (source) {
        closestStorage = findEnergy(source, -1, void 0, STRUCTURE_STORAGE, "transfer");
        if (!closestStorage) {
          closestContainer = findEnergy(source, -1, void 0, STRUCTURE_CONTAINER, "transfer", Memory.energy.miningContainers);
        }
        target = chooseClosest(source, [closestStorage, closestContainer]);
        tempDistance = target ? getDistance(source, target) : 0;
        totalEnergyTransportersRequired += Math.floor((tempDistance + energyTransporterConstant - 1) / energyTransporterConstant);
      }
    }
    Memory.energy.totalTransportersRequired = totalEnergyTransportersRequired;
  }
  console.log(energy, energyMax, spawning, moreMinersRequired, Memory.structures.buildingSites.length);
  basicEconomyRunning = roleCnt.energyMiner > 1 && roleCnt.energyRefiller > 1 && roleCnt.energyTransporter > 1;
  if (!spawning && (energy >= 300 && !basicEconomyRunning || energy >= energyMax)) {
    if (!basicEconomyRunning && roleCnt.harvester < 2) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'harvester');
      if (name) {
        console.log(roleCnt.harvester + 1, "/", "Spawning new harvester!", name);
      }
    } else if (energy >= 200 && spawnHighPriorityDefense) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'fighter', 1, 1, 1, "0", Game.spawns.Spawn1.room.name);
      if (name) {
        console.log(roleCnt.fighter + 1, "/", "Spawning new fighter!", name);
      }
    } else if (energy >= 200 && moreMinersRequired && roleCnt.energyRefiller >= minimumNumberOfEnergyRefillers) {
      ref10 = Memory.energy.energySources;
      for (i = u = 0, len8 = ref10.length; u < len8; i = ++u) {
        source = ref10[i];
        sourceID = Memory.energy.energySources[i][0];
        maxMiners = Memory.energy.energySources[i][1];
        maxBodyParts = Memory.energy.energySources[i][2];
        sourceRoomName = Memory.energy.energySources[i][3];
        countBodyParts = 0;
        if (Memory.energy.energySourceMiners[i]) {
          ref11 = Memory.energy.energySourceMiners;
          for (j = v = 0, len9 = ref11.length; v < len9; j = ++v) {
            miner = ref11[j];
            ref12 = Memory.energy.energySourceMiners[i];
            for (w = 0, len10 = ref12.length; w < len10; w++) {
              name = ref12[w];
              if (name) {
                countBodyParts += Game.creeps[name].getActiveBodyparts(WORK);
              }
            }
          }
        } else {
          Memory.energy.energySourceMiners.push([]);
        }
        if (Memory.energy.energySourceMiners[i].length < maxMiners && countBodyParts < maxBodyParts) {
          name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'sourceMiner', sourceID, sourceRoomName);
          if (name) {
            console.log(roleCnt.sourceMiner + 1, "/", Memory.energy.energySources.length, "Spawning new sourceMiner!", name);
            Memory.energy.energySourceMiners[i].push(name);
            break;
          }
        }
      }
    } else if (energy >= 200 && (combinedTicksEnergyRefiller < 300 || roleCnt.energyRefiller < minimumNumberOfEnergyRefillers)) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyRefiller');
      if (name) {
        console.log(roleCnt.energyRefiller + 1, "/", minimumNumberOfEnergyRefillers, "Spawning new energyRefiller!", name);
      }
    } else if (energy >= 200 && roleCnt.energyTransporter < Memory.energy.totalTransportersRequired) {
      ref13 = Memory.energy.energySources;
      for (i = x = 0, len11 = ref13.length; x < len11; i = ++x) {
        energySource = ref13[i];
        sourceID = Memory.energy.energySources[i][0];
        source = Game.getObjectById(sourceID);
        sourceRoomName = Memory.energy.energySources[i][3];
        if (source) {
          closestStorage = findEnergy(source, -1, void 0, STRUCTURE_STORAGE, "transfer");
          if (!closestStorage) {
            closestContainer = findEnergy(source, -1, void 0, STRUCTURE_CONTAINER, "transfer", Memory.energy.miningContainers);
          }
          target = chooseClosest(source, [closestStorage, closestContainer]);
          tempDistance = target ? getDistance(source, target) : 0;
          totalEnergyTransportersRequired = Math.floor((tempDistance + energyTransporterConstant - 1) / energyTransporterConstant);
          if (Memory.energy.energySourceTransporters[i].length < totalEnergyTransportersRequired) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyTransporter', sourceID, sourceRoomName);
            if (name) {
              Memory.energy.energySourceTransporters[i].push(name);
            }
          }
        }
      }
      if (name) {
        console.log(roleCnt.energyTransporter + 1, "/", Memory.energy.totalTransportersRequired, "Spawning new energyTransporter!", name);
      }
    } else if (energy >= 650 && newClaimerRequired) {
      ref14 = Memory.claims.claimLocations;
      for (i = y = 0, len12 = ref14.length; y < len12; i = ++y) {
        location = ref14[i];
        console.log("buggerino4");
        roomName = location[0];
        if (Game.rooms[roomName]) {
          if (Game.rooms[roomName2].controller.my) {
            if (Game.rooms[roomName2].controller.reservation || Game.rooms[roomName2].controller.reservation.username === "Burny" && Game.rooms[roomName2].controller.reservation.ticksToEnd < 200) {
              c = Game.rooms[roomName].controller.pos;
              countWalkableTiles = lookAtArea(c.y - 1, c.x - 1, c.y + 1, c.x + 1, true).filter(function(s) {
                return s.type === "terrain" && (s.terrain === "swamp" || s.terrain === "normal");
              });
              if (Memory.claims.claimClaimers[i].length < countWalkableTiles.length) {
                console.log("buggerino67");
                name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'claimer', location[0], location[1], Game.spawns.Spawn1.room.name);
                if (name) {
                  Memory.claims.claimClaimers[i].push(name);
                  console.log(numberOfClaimers + 1, "/", "Spawning new claimer!", name);
                }
              }
            }
          }
        } else {
          console.log("buggerino56");
          name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'claimer', location[0], location[1], Game.spawns.Spawn1.room.name);
          if (name) {
            Memory.claims.claimClaimers[i].push(name);
            console.log(numberOfClaimers + 1, "/", "Spawning new claimer!", name);
          }
        }
      }
    } else if (energy >= 300 && roleCnt.repairer < minimumNumberOfRepairers) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'repairer');
      if (name) {
        console.log(roleCnt.repairer + 1, "/", minimumNumberOfRepairers, "Spawning new repairer!", name);
      }
    } else if (energy >= 300 && roleCnt.builder < minimumNumberOfBuilders) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'builder');
      if (name) {
        console.log(roleCnt.builder + 1, "/", minimumNumberOfBuilders, "Spawning new builder!", name);
      }
    } else if (energy >= 300 && roleCnt.upgrader < minimumNumberOfUpgraders) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'upgrader');
      if (name) {
        console.log(roleCnt.upgrader + 1, "/", minimumNumberOfUpgraders, "Spawning new upgrader!", name);
      }
    } else if (energy >= 200 && spawnLowPriorityWarrior) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'fighter', 1, 1, 1, "0", Game.spawns.Spawn1.room.name);
      if (name) {
        console.log(roleCnt.fighter + 1, "/", "Spawning new fighter!", name);
      }
    }
  }
  if (!Memory.structures.scheduledBuildings) {
    Memory.structures.scheduledBuildings = [];
  }
  if (modulo(Game.time, 300) === 0) {
    results = [];
    for (i = z = 40; z >= 31; i = z += -2) {
      results.push((function() {
        var aa, results1;
        results1 = [];
        for (j = aa = 37; aa <= 43; j = aa += 2) {
          Memory.structures.scheduledBuildings.push([i, j, STRUCTURE_EXTENSION]);
          results1.push(Memory.structures.scheduledBuildings.push([i - 1, j + 1, STRUCTURE_EXTENSION]));
        }
        return results1;
      })());
    }
    return results;
  } else {
    if (Memory.structures.scheduledBuildings.length > 0) {
      loc = Memory.structures.scheduledBuildings[0];
      Game.spawns.Spawn1.room.createConstructionSite(loc[0], loc[1], loc[2]);
      return Memory.structures.scheduledBuildings.splice(0, 1);
    }
  }

  /*
   * loop over array
  temaList = [
      "yolo"
      "zither"
      "burny"]
  returnList = item for item in temaList when item is "yolo" #returns ["yolo"]
  console.log returnList
  
   * to loop over objects / dictionaries:
  teamlist =
      "burny": 0
      "pino": 1
      "crexis": 2
  returnList = item for key,item of temaList when item is 2 #returns [2]
  returnList2 = key for key,item of temaList when item is 2 #returns ["crexis"]
      console.log returnList
      console.log returnList2
   */
};
