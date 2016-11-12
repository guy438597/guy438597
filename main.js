var calculations, chooseClosest, findEnergy, getDistance, getDistanceInTicks, runRoles;

require('./spawnV2')();

calculations = require("./calculations");

chooseClosest = calculations.chooseClosest;

findEnergy = calculations.findEnergy;

getDistance = calculations.getDistance;

getDistanceInTicks = calculations.getDistanceInTicks;

runRoles = require("./creeproles");

module.exports.loop = function() {
  var attackTarget, basicEconomyRunning, c, closestSpawn, combinedTicksEnergyRefiller, countBodyParts, countWalkableTiles, creep, energy, energyMax, energySource, energyTransporterConstant, healTarget, i, item, j, k, key, l, len, len1, len10, len11, len12, len2, len3, len4, len5, len6, len7, len8, len9, location, m, maxBodyParts, maxMiners, miner, minimumNumberOfBuilders, minimumNumberOfEnergyRefillers, minimumNumberOfRepairers, minimumNumberOfUpgraders, moreMinersRequired, name, newClaimerRequired, o, p, q, r, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, repairTarget, results, results1, roleCnt, room, roomName, source, sourceID, sourceRoomName, spawn, spawnHighPriorityDefense, spawnLowPriorityAttack, spawnName, spawning, t, tempDistance, totalEnergyTransportersRequired, tower, towers, u, username, v, w, x, y;
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
  spawnLowPriorityAttack = false;
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
  if (Game.time % 30 === 0) {
    Memory.structures.repairTargets = [];
    Memory.structures.buildingSites = [];
    ref6 = Game.rooms;
    for (name in ref6) {
      room = ref6[name];
      Memory.structures.repairTargets.concat(Game.rooms[name].find(FIND_STRUCTURES, {
        filter: function(s) {
          return (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER || s.my) && s.hits < s.hitsMax * Memory.structures.repairFactor;
        }
      }));
      Memory.structures.buildingSites.concat(Game.rooms[name].find(FIND_MY_CONSTRUCTION_SITES));
    }
  } else {
    if (Memory.structures.repairTargets) {
      Memory.structures.repairTargets = Memory.structures.repairTargets.filter(function(s) {
        return s !== null;
      });
    }
    if (Memory.structures.buildingSites) {
      Memory.structures.buildingSites = Memory.structures.buildingSites.filter(function(s) {
        return s !== null;
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
      source = ref9[i];
      source = Game.getObjectById(Memory.energy.energySources[i][0]);
      if (source) {
        closestSpawn = chooseClosest(source, (function() {
          var ref10, results;
          ref10 = Game.spawns;
          results = [];
          for (spawnName in ref10) {
            spawn = ref10[spawnName];
            results.push(spawn);
          }
          return results;
        })());
        tempDistance = getDistance(source, closestSpawn);
        totalEnergyTransportersRequired += Math.floor((tempDistance + energyTransporterConstant - 1) / energyTransporterConstant);
      }
    }
    Memory.energy.totalTransportersRequired = totalEnergyTransportersRequired;
  }
  basicEconomyRunning = roleCnt.energyMiner > 1 && roleCnt.energyRefiller > 1 && roleCnt.energyTransporter > 1;
  if (!spawning && (energy >= 200 && !basicEconomyRunning || energy >= energyMax)) {
    if (!basicEconomyRunning && roleCnt.harvester < 2) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'harvester');
      if (name) {
        console.log(roleCnt.harvester + 1, "/", "Spawning new harvester!", name);
      }
    }
    if (energy >= 200 && spawnHighPriorityDefense) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'fighter', 1, 1, 1, "0", Game.spawns.Spawn1.room.name);
      if (name) {
        return console.log(roleCnt.fighter + 1, "/", "Spawning new fighter!", name);
      }
    } else if (energy >= 200 && moreMinersRequired && roleCnt.energyRefiller >= minimumNumberOfEnergyRefillers) {
      ref10 = Memory.energy.energySources;
      results = [];
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
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    } else if (energy >= 200 && (combinedTicksEnergyRefiller < 300 || roleCnt.energyRefiller < minimumNumberOfEnergyRefillers)) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyRefiller');
      if (name) {
        return console.log(roleCnt.energyRefiller + 1, "/", minimumNumberOfEnergyRefillers, "Spawning new energyRefiller!", name);
      }
    } else if (energy >= 200 && roleCnt.energyTransporter < Memory.energy.totalTransportersRequired) {
      ref13 = Memory.energy.energySources;
      for (i = x = 0, len11 = ref13.length; x < len11; i = ++x) {
        energySource = ref13[i];
        sourceID = Memory.energy.energySources[i][0];
        source = Game.getObjectById(sourceID);
        sourceRoomName = Memory.energy.energySources[i][3];
        if (source) {
          closestSpawn = chooseClosest(source, (function() {
            var ref14, results1;
            ref14 = Game.spawns;
            results1 = [];
            for (spawnName in ref14) {
              spawn = ref14[spawnName];
              results1.push(Game.spawns[spawnName]);
            }
            return results1;
          })());
          tempDistance = getDistance(source, closestSpawn);
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
        return console.log(roleCnt.energyTransporter + 1, "/", Memory.energy.totalTransportersRequired, "Spawning new energyTransporter!", name);
      }
    } else if (energy >= 650 && newClaimerRequired) {
      ref14 = Memory.claims.claimLocations;
      results1 = [];
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
                  results1.push(console.log(numberOfClaimers + 1, "/", "Spawning new claimer!", name));
                } else {
                  results1.push(void 0);
                }
              } else {
                results1.push(void 0);
              }
            } else {
              results1.push(void 0);
            }
          } else {
            results1.push(void 0);
          }
        } else {
          console.log("buggerino56");
          name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'claimer', location[0], location[1], Game.spawns.Spawn1.room.name);
          if (name) {
            Memory.claims.claimClaimers[i].push(name);
            results1.push(console.log(numberOfClaimers + 1, "/", "Spawning new claimer!", name));
          } else {
            results1.push(void 0);
          }
        }
      }
      return results1;
    } else if (energy >= 300 && roleCnt.repairer < minimumNumberOfRepairers) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'repairer');
      if (name) {
        return console.log(roleCnt.repairer + 1, "/", minimumNumberOfRepairers, "Spawning new repairer!", name);
      }
    } else if (energy >= 300 && roleCnt.builder < minimumNumberOfBuilders) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'builder');
      if (name) {
        return console.log(roleCnt.builder + 1, "/", minimumNumberOfBuilders, "Spawning new builder!", name);
      }
    } else if (energy >= 300 && roleCnt.upgrader < minimumNumberOfUpgraders) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'upgrader');
      if (name) {
        return console.log(roleCnt.upgrader + 1, "/", minimumNumberOfUpgraders, "Spawning new upgrader!", name);
      }
    } else if (energy >= 200 && spawnLowPriorityAttack) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'fighter', 1, 1, 1, "0", Game.spawns.Spawn1.room.name);
      if (name) {
        return console.log(roleCnt.fighter + 1, "/", "Spawning new fighter!", name);
      }
    }
  }
};


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
