var calculations, chooseClosest, findEnergy, getDistance, getDistanceInTicks, runRoles,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

require('./spawnV2')();

calculations = require("./calculations");

chooseClosest = calculations.chooseClosest;

findEnergy = calculations.findEnergy;

getDistance = calculations.getDistance;

getDistanceInTicks = calculations.getDistanceInTicks;

runRoles = require("./creeproles");

module.exports.loop = function() {
  var aa, attackTarget, basicEconomyRunning, c, closestSpawn, combinedTicksEnergyRefiller, countBodyParts, countWalkableTiles, creep, energy, energyMax, energySource, energyTransporterConstant, healTarget, i, item, j, k, key, l, len, len1, len10, len11, len12, len13, len14, len2, len3, len4, len5, len6, len7, len8, len9, location, m, maxBodyParts, maxMiners, miner, minimumNumberOfBuilders, minimumNumberOfEnergyRefillers, minimumNumberOfRepairers, minimumNumberOfUpgraders, moreMinersRequired, n, name, newClaimerRequired, newbuildingSites, newrepairTargets, o, p, q, r, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref15, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, repairTarget, results, results1, roleCnt, room, roomName, s, source, sourceID, sourceRoomName, spawn, spawnHighPriorityDefense, spawnLowPriorityAttack, spawnName, spawning, t, tempDistance, totalEnergyTransportersRequired, tower, towers, u, v, w, x, y, z;
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
  if (Memory.structures === void 0) {
    Memory.structures = {};
  }
  Memory.structures.repairFactor = 0.75;
  if (!Memory.energy) {
    Memory.energy = {};
  }
  if (!Memory.energy.miningContainers) {
    Memory.energy.miningContainers = [];
  }
  Memory.energy.energySources = [["986b04ea5112ddeede7ea467", 3, 5, "E62S49"]];
  if (!Memory.claims) {
    Memory.claims = {};
  }
  Memory.claims.claimLocations = [["E61S49", "r"]];
  if (!Memory.energy.energySourceMiners === void 0) {
    Memory.energy.energySourceMiners = [];
  }
  ref1 = Memory.energy.energySourceMiners;
  for (i = k = 0, len = ref1.length; k < len; i = ++k) {
    name = ref1[i];
    Memory.energy.energySourceMiners[i] = Memory.energy.energySourceMiners[i].filter(function(name) {
      return Game.creeps[name] !== void 0;
    });
  }
  if (Memory.structures.buildingSites === void 0) {
    Memory.structures.buildingSites = [];
  }
  if (Memory.structures.repairTargets === void 0) {
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
    return Game.getObjectById(id) !== null;
  });
  moreMinersRequired = false;
  if (Memory.energy.energySourceMiners === void 0) {
    Memory.energy.energySourceMiners = [];
  }
  for (i = l = 0, ref2 = Memory.energy.energySources.length; 0 <= ref2 ? l <= ref2 : l >= ref2; i = 0 <= ref2 ? ++l : --l) {
    if (Memory.energy.energySourceMiners.length < i) {
      Memory.energy.energySourceMiners.push([]);
    }
  }
  console.log(Memory.energy.energySourceMiners);
  if (Memory.energy.energySourceMiners.length < Memory.energy.energySources.length) {
    Memory.energy.energySourceMiners.push([]);
  }
  while (Memory.energy.energySourceMiners.length < Memory.energy.energySources.length) {
    Memory.energy.energySourceMiners.push([]);
  }
  console.log(Memory.energy.energySourceMiners);
  Memory.energy.energySourceMiners = Memory.energy.energySourceMiners.filter(function(name) {
    return Game.creeps[name] !== void 0;
  });
  ref3 = Memory.energy.energySources;
  for (i = m = 0, len1 = ref3.length; m < len1; i = ++m) {
    source = ref3[i];
    maxMiners = source[1];
    maxBodyParts = source[2];
    countBodyParts = 0;
    if (Memory.energy.energySourceMiners[i] !== []) {
      ref4 = Memory.energy.energySourceMiners[i];
      for (n = 0, len2 = ref4.length; n < len2; n++) {
        name = ref4[n];
        countBodyParts += Game.creeps[name].getActiveBodyparts(WORK);
      }
    }
    if (Memory.energy.energySourceMiners[i].length < maxMiners && countBodyParts < maxBodyParts) {
      moreMinersRequired = true;
    }
  }
  if (Memory.claims.claimClaimers === void 0) {
    Memory.claims.claimClaimers = [];
  }
  while (Memory.claims.claimClaimers.length < Memory.claims.claimLocations.length) {
    Memory.claims.claimClaimers.push([]);
  }
  ref5 = Memory.claims.claimClaimers;
  for (i = o = 0, len3 = ref5.length; o < len3; i = ++o) {
    name = ref5[i];
    Memory.claims.claimClaimers = Memory.claims.claimClaimers.filter(function(name) {
      return Game.creeps[name] !== void 0;
    });
  }
  newClaimerRequired = false;
  if (!Memory.claims.claimLocations) {
    Memory.claims.claimLocations = [];
  }
  ref6 = Memory.claims.claimLocations;
  for (i = p = 0, len4 = ref6.length; p < len4; i = ++p) {
    location = ref6[i];
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
        if (repairTarget) {
          tower.repair(repairTarget);
        }
      }
    }
  }
  if (Game.time % 30 === 0) {
    Memory.structures.repairTargets = [];
    Memory.structures.buildingSites = [];
    ref7 = Game.rooms;
    for (name in ref7) {
      room = ref7[name];
      newrepairTargets = Game.rooms[name].find(FIND_STRUCTURES, {
        filter: function(s) {
          return (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER || s.my) && s.hits < s.hitsMax * Memory.structures.repairFactor;
        }
      }, newbuildingSites = Game.rooms[name].find(FIND_MY_CONSTRUCTION_SITES));
      for (r = 0, len6 = newrepairTargets.length; r < len6; r++) {
        i = newrepairTargets[r];
        Memory.structures.repairTargets = Memory.structures.repairTargets.concat((function() {
          var len7, ref8, results, t;
          results = [];
          for (t = 0, len7 = newrepairTargets.length; t < len7; t++) {
            s = newrepairTargets[t];
            if (ref8 = s.id, indexOf.call(Memory.structures.repairTargets, ref8) < 0) {
              results.push(s.id);
            }
          }
          return results;
        })());
      }
      for (t = 0, len7 = newbuildingSites.length; t < len7; t++) {
        i = newbuildingSites[t];
        Memory.structures.buildingSites = Memory.structures.buildingSites.concat((function() {
          var len8, ref8, results, u;
          results = [];
          for (u = 0, len8 = newbuildingSites.length; u < len8; u++) {
            s = newbuildingSites[u];
            if (ref8 = s.id, indexOf.call(Memory.structures.buildingSites, ref8) < 0) {
              results.push(s.id);
            }
          }
          return results;
        })());
      }
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
      var ref8, results;
      ref8 = Game.creeps;
      results = [];
      for (key in ref8) {
        item = ref8[key];
        if (item.memory.role === "sourceMiner") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    energyRefiller: ((function() {
      var ref8, results;
      ref8 = Game.creeps;
      results = [];
      for (key in ref8) {
        item = ref8[key];
        if (item.memory.role === "energyRefiller") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    energyTransporter: ((function() {
      var ref8, results;
      ref8 = Game.creeps;
      results = [];
      for (key in ref8) {
        item = ref8[key];
        if (item.memory.role === "energyTransporter") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    harvester: ((function() {
      var ref8, results;
      ref8 = Game.creeps;
      results = [];
      for (key in ref8) {
        item = ref8[key];
        if (item.memory.role === "harvester") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    builder: ((function() {
      var ref8, results;
      ref8 = Game.creeps;
      results = [];
      for (key in ref8) {
        item = ref8[key];
        if (item.memory.role === "builder") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    repairer: ((function() {
      var ref8, results;
      ref8 = Game.creeps;
      results = [];
      for (key in ref8) {
        item = ref8[key];
        if (item.memory.role === "repairer") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    wallRepairer: ((function() {
      var ref8, results;
      ref8 = Game.creeps;
      results = [];
      for (key in ref8) {
        item = ref8[key];
        if (item.memory.role === "wallRepairer") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    upgrader: ((function() {
      var ref8, results;
      ref8 = Game.creeps;
      results = [];
      for (key in ref8) {
        item = ref8[key];
        if (item.memory.role === "upgrader") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    claimer: ((function() {
      var ref8, results;
      ref8 = Game.creeps;
      results = [];
      for (key in ref8) {
        item = ref8[key];
        if (item.memory.role === "claimer") {
          results.push(item);
        }
      }
      return results;
    })()).length,
    fighter: ((function() {
      var ref8, results;
      ref8 = Game.creeps;
      results = [];
      for (key in ref8) {
        item = ref8[key];
        if (item.memory.role === "fighter") {
          results.push(item);
        }
      }
      return results;
    })()).length
  };
  console.log(roleCnt.sourceMiner, roleCnt.energyRefiller, roleCnt.energyTransporter, roleCnt.builder, roleCnt.repairer);
  combinedTicksEnergyRefiller = 0;
  ref8 = Game.creeps;
  for (name in ref8) {
    creep = ref8[name];
    if (Game.creeps[name].spawning) {
      continue;
    }
    if (creep.memory.role === "harvester") {
      if (roleCnt["sourceMiner"] > 1 && roleCnt["energyRefiller"] > 1 && roleCnt["energyTransporter"] > 1) {
        creep.suicide();
      } else {

      }
    } else if (creep.memory.role === "energyRefiller") {
      combinedTicksEnergyRefiller += creep.ticksToLive;
    }
    runRoles[creep.memory.role](creep);
  }
  if (Memory.energy.energySourceTransporters) {
    Memory.energy.energySourceTransporters = [];
  }
  while (Memory.energy.energySourceTransporters.length < Memory.energy.energySources.length) {
    Memory.energy.energySourceTransporters.push([]);
  }
  ref9 = Memory.energy.energySourceTransporters[i];
  for (i = u = 0, len8 = ref9.length; u < len8; i = ++u) {
    name = ref9[i];
    console.log(i);
    Memory.energy.energySourceTransporters[i] = Memory.energy.energySourceTransporters[i].filter(function(name) {
      return Game.creeps[name] !== void 0;
    });
  }
  if (Memory.energy.totalEnergyTransportersRequired === void 0) {
    Memory.energy.totalEnergyTransportersRequired = 0;
  }
  if (!(Game.time % 30)) {
    totalEnergyTransportersRequired = 0;
    ref10 = Memory.energy.energySources;
    for (i = v = 0, len9 = ref10.length; v < len9; i = ++v) {
      source = ref10[i];
      source = Game.getObjectById(Memory.energy.energySources[i][0]);
      if (source) {
        closestSpawn = chooseClosest(source, (function() {
          var ref11, results;
          ref11 = Game.spawns;
          results = [];
          for (spawnName in ref11) {
            spawn = ref11[spawnName];
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
    if (energy >= 190 && spawnHighPriorityDefense) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'fighter', 1, 1, 1, "0", Game.spawns.Spawn1.room.name);
      if (name) {
        return console.log(roleCnt.fighter + 1, "/", "Spawning new fighter!", name);
      }
    } else if (energy >= Math.min(650, energyMax) && moreMinersRequired && roleCnt.energyRefiller > 1) {
      if (Memory.energy.energySourceMiners) {
        ref11 = Memory.energy.energySources;
        results = [];
        for (i = w = 0, len10 = ref11.length; w < len10; i = ++w) {
          source = ref11[i];
          sourceID = Memory.energy.energySources[i][0];
          maxMiners = Memory.energy.energySources[i][1];
          maxBodyParts = Memory.energy.energySources[i][2];
          sourceRoomName = Memory.energy.energySources[i][3];
          countBodyParts = 0;
          if (Memory.energy.energySourceMiners[i]) {
            ref12 = Memory.energy.energySourceMiners;
            for (j = x = 0, len11 = ref12.length; x < len11; j = ++x) {
              miner = ref12[j];
              ref13 = Memory.energy.energySourceMiners[i];
              for (y = 0, len12 = ref13.length; y < len12; y++) {
                name = ref13[y];
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
      }
    } else if (energy >= 150 && (combinedTicksEnergyRefiller < 300 || roleCnt.energyRefiller < 2)) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyRefiller');
      if (name) {
        return console.log(roleCnt.energyRefiller + 1, "/", 2, "Spawning new energyRefiller!", name);
      }
    } else if (energy >= 150 && roleCnt.energyTransporter < Memory.energy.totalTransportersRequired) {
      ref14 = Memory.energy.energySources;
      for (i = z = 0, len13 = ref14.length; z < len13; i = ++z) {
        energySource = ref14[i];
        sourceID = Memory.energy.energySources[i][0];
        source = Game.getObjectById(sourceID);
        if (source) {
          closestSpawn = chooseClosest(source, (function() {
            var ref15, results1;
            ref15 = Game.spawns;
            results1 = [];
            for (spawnName in ref15) {
              spawn = ref15[spawnName];
              results1.push(spawn);
            }
            return results1;
          })());
          tempDistance = getDistance(source, closestSpawn);
          totalEnergyTransportersRequired = Math.floor((tempDistance + energyTransporterConstant - 1) / energyTransporterConstant);
          if (Memory.energy.energySourceTransporters[i].length < totalEnergyTransportersRequired) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyTransporter', sourceID);
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
      ref15 = Memory.claims.claimLocations;
      results1 = [];
      for (i = aa = 0, len14 = ref15.length; aa < len14; i = ++aa) {
        location = ref15[i];
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
    } else if (energy >= 200 && roleCnt.upgrader < minimumNumberOfUpgraders) {
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
