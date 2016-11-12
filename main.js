var calculations, chooseClosest, creeproles, findEnergy, getDistance, getDistanceInTicks;

require('./spawnV2')();

calculations = require("./calculations");

chooseClosest = calculations.chooseClosest;

findEnergy = calculations.findEnergy;

getDistance = calculations.getDistance;

getDistanceInTicks = calculations.getDistanceInTicks;

creeproles = require("./creeproles");

module.exports.loop = (function() {
  var aa, attackTarget, basicEconomyRunning, c, closestSpawn, combinedTicksEnergyRefiller, countBodyParts, countWalkableTiles, creep, energy, energyMax, energyTransporterConstant, healTarget, i, item, j, k, key, l, len, len1, len10, len11, len12, len13, len14, len15, len2, len3, len4, len5, len6, len7, len8, len9, location, m, maxBodyParts, maxMiners, miner, minimumNumberOfBuilders, minimumNumberOfEnergyRefillers, minimumNumberOfRepairers, minimumNumberOfUpgraders, moreMinersRequired, n, name, newClaimerRequired, newbuildingSites, newrepairTargets, o, p, q, r, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref15, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, repairTarget, roleCnt, room, roomName, runRoles, s, source, sourceID, sourceRoomName, spawn, spawnHighPriorityDefense, spawnLowPriorityAttack, spawnName, spawning, t, tempDistance, totalEnergyTransportersRequired, tower, towers, u, v, w, x, y, z;

  function loop() {}

  console.log(Game.time);

  runRoles = new creeproles();

  ref = Memory.creeps;
  for (name in ref) {
    creep = ref[name];
    if (!creep) {
      delete Memory.creeps[name];
    }
  }

  energyTransporterConstant = 15;

  minimumNumberOfUpgraders = 7;

  spawnHighPriorityDefense = false;

  spawnLowPriorityAttack = false;

  if (!Memory.energy) {
    Memory.energy = {};
  }

  if (!Memory.energy.miningContainers) {
    Memory.energy.miningContainers = [];
  }

  Memory.energy.energySources = [["57ef9e7a86f108ae6e60f5c3", 3, 5, "E62S49"], ["57ef9e7a86f108ae6e60f5c5", 4, 5, "E62S49"], ["57ef9e6786f108ae6e60f3f9", 2, 5, "E61S49"], ["57ef9e6786f108ae6e60f3fb", 1, 5, "E61S49"]];

  if (!Memory.claims) {
    Memory.claims = {};
  }

  Memory.claims.claimLocations = [["E61S49", "r"]];

  if (!Memory.energy.energySourceMiners) {
    Memory.energy.energySourceMiners = [];
  }

  ref1 = Memory.energy.energySourceMiners;
  for (i = k = 0, len = ref1.length; k < len; i = ++k) {
    name = ref1[i];
    Memory.energy.energySourceMiners = Memory.energy.energySourceMiners.filter(function(s) {
      return !Game.creeps[name];
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

  moreMinersRequired = false;

  if (!Memory.energy.energySourceMiners) {
    Memory.energy.energySourceMiners = [];
  }

  if (Memory.energy.energySourceMiners) {
    ref2 = Memory.energy.energySources;
    for (i = l = 0, len1 = ref2.length; l < len1; i = ++l) {
      source = ref2[i];
      maxMiners = Memory.energy.energySources[i][1];
      maxBodyParts = Memory.energy.energySources[i][2];
      countBodyParts = 0;
      if (Memory.energy.energySourceMiners[i]) {
        ref3 = Memory.energy.energySourceMiners;
        for (j = m = 0, len2 = ref3.length; m < len2; j = ++m) {
          miner = ref3[j];
          countBodyParts += 0;
          ref4 = Memory.energy.energySourceMiners[i];
          for (n = 0, len3 = ref4.length; n < len3; n++) {
            name = ref4[n];
            if (name) {
              countBodyParts += Game.creeps[name].getActiveBodyparts(WORK);
            }
          }
        }
      } else {
        Memory.energy.energySourceMiners.push([]);
      }
      if (Memory.energy.energySourceMiners[i].length < maxMiners && countBodyParts < maxBodyParts) {
        moreMinersRequired = true;
        break;
      }
    }
  }

  if (!Memory.claims.claimClaimers) {
    Memory.claims.claimClaimers = [];
  }

  while (Memory.claims.claimClaimers.length < Memory.claims.claimLocations.length) {
    Memory.claims.claimClaimers.push([]);
  }

  ref5 = Memory.claims.claimClaimers;
  for (i = o = 0, len4 = ref5.length; o < len4; i = ++o) {
    name = ref5[i];
    Memory.claims.claimClaimers = Memory.claims.claimClaimers.filter(function(s) {
      return !Game.creeps[name];
    });
  }

  newClaimerRequired = false;

  if (!Memory.claims.claimLocations) {
    Memory.claims.claimLocations = [];
  }

  ref6 = Memory.claims.claimLocations;
  for (i = p = 0, len5 = ref6.length; p < len5; i = ++p) {
    location = ref6[i];
    roomName = location[0];
    if (Game.rooms[roomName]) {
      if (Game.rooms[roomName].controller.my) {
        if (!Game.rooms[roomName].controller.reservation || Game.rooms[roomName].controller.reservation.username === "Burny" && Game.rooms[roomName].controller.reservation.ticksToEnd < 200) {
          c = Game.rooms[roomName].controller.pos;
          countWalkableTiles = lookAtArea(c.y - 1, c.x - 1, c.y + 1, c.x + 1, true).filter(function(s) {
            return s.type === "terrain" && (s.terrain === "swamp" || s.terrain === "normal");
          });
          if (Memory.claims.claimClaimers[i].length < countWalkableTiles.length) {
            newClaimerRequired = true;
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

  for (q = 0, len6 = towers.length; q < len6; q++) {
    tower = towers[q];
    attackTarget = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: function(s) {
        return s.getActiveBodyparts(HEAL) > 0;
      }
    });
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

  if (Memory.structures) {
    Memory.structures = {};
  }

  if (!(Game.time % 60)) {
    Memory.structures.repairTargets = [];
    Memory.structures.buildingSites = [];
    ref7 = Game.rooms;
    for (name in ref7) {
      room = ref7[name];
      newrepairTargets = room.find(FIND_STRUCTURES, filter(function(s) {
        return (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER || s.my) && s.hits < s.hitsMax * repairFactor;
      }), newbuildingSites = room.find(FIND_MY_CONSTRUCTION_SITES));
      for (r = 0, len7 = newrepairTargets.length; r < len7; r++) {
        i = newrepairTargets[r];
        Memory.structures.repairTargets.concat((function() {
          var len8, results, t;
          results = [];
          for (t = 0, len8 = newrepairTargets.length; t < len8; t++) {
            s = newrepairTargets[t];
            results.push(s.id);
          }
          return results;
        })());
      }
      for (t = 0, len8 = newbuildingSites.length; t < len8; t++) {
        i = newbuildingSites[t];
        Memory.structures.buildingSites.concat((function() {
          var len9, results, u;
          results = [];
          for (u = 0, len9 = newbuildingSites.length; u < len9; u++) {
            s = newbuildingSites[u];
            results.push(s.id);
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

  combinedTicksEnergyRefiller = 0;

  ref8 = Game.creeps;
  for (name in ref8) {
    creep = ref8[name];
    if (creep.spawning) {
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

  if (!Memory.energy.totalEnergyTransportersRequired) {
    Memory.energy.totalEnergyTransportersRequired = 0;
  }

  if (!(Game.time % 30)) {
    totalEnergyTransportersRequired = 0;
    ref9 = Memory.energy.energySources;
    for (i = u = 0, len9 = ref9.length; u < len9; i = ++u) {
      source = ref9[i];
      console.log("buggerino");
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
  } else {
    if (!Memory.energy.energySourceTransporters) {
      Memory.energy.energySourceTransporters = [];
    }
    ref10 = Memory.energy.energySourceTransporters[i];
    for (i = v = 0, len10 = ref10.length; v < len10; i = ++v) {
      name = ref10[i];
      Memory.energy.energySourceTransporters[i] = Memory.energy.energySourceTransporters[i].filter(function(s) {
        return !Game.creeps[name];
      });
    }
  }

  basicEconomyRunning = roleCnt.energyMiner > 1 && roleCnt.energyRefiller > 1 && roleCnt.energyTransporter > 1;

  if (!spawning && (energy >= 300 && !basicEconomyRunning && energy >= 200)) {
    if (energy >= 190 && spawnHighPriorityDefense) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'fighter', 1, 1, 1, "0", Game.spawns.Spawn1.room.name);
      if (name) {
        console.log(roleCnt.fighter + 1, "/", "Spawning new fighter!", name);
      }
    } else if (Math.max(Math.min(650, energy), 200) >= 200 && moreMinersRequired && roleCnt.energyRefiller > 0) {
      if (Memory.energy.energySourceMiners) {
        ref11 = Memory.energy.energySources;
        for (i = w = 0, len11 = ref11.length; w < len11; i = ++w) {
          source = ref11[i];
          sourceID = Memory.energy.energySources[i][0];
          maxMiners = Memory.energy.energySources[i][1];
          maxBodyParts = Memory.energy.energySources[i][2];
          sourceRoomName = Memory.energy.energySources[i][3];
          countBodyParts = 0;
          if (Memory.energy.energySourceMiners[i]) {
            ref12 = Memory.energy.energySourceMiners;
            for (j = x = 0, len12 = ref12.length; x < len12; j = ++x) {
              miner = ref12[j];
              countBodyParts += 0;
              ref13 = Memory.energy.energySourceMiners[i];
              for (y = 0, len13 = ref13.length; y < len13; y++) {
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
              break;
            }
          }
        }
      }
    } else if (energy >= 150 && (combinedTicksEnergyRefiller < 300 || roleCnt.energyRefiller < 2)) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyRefiller');
      if (name) {
        console.log(roleCnt.energyRefiller + 1, "/", 2, "Spawning new energyRefiller!", name);
      }
    } else if (energy >= 150 && roleCnt.energyTransporter < Memory.energy.totalTransportersRequired) {
      ref14 = Memory.energy.energySources;
      for (i = z = 0, len14 = ref14.length; z < len14; i = ++z) {
        sourceID = ref14[i];
        console.log("buggerino3");
        source = Game.getObjectById(Memory.energy.energySources[i][0]);
        if (source) {
          closestSpawn = chooseClosest(source, (function() {
            var ref15, results;
            ref15 = Game.spawns;
            results = [];
            for (spawnName in ref15) {
              spawn = ref15[spawnName];
              results.push(spawn);
            }
            return results;
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
        console.log(roleCnt.energyTransporter + 1, "/", Memory.energy.totalTransportersRequired, "Spawning new energyTransporter!", name);
      }
    } else if (energy >= 650 && newClaimerRequired) {
      ref15 = Memory.claims.claimLocations;
      for (i = aa = 0, len15 = ref15.length; aa < len15; i = ++aa) {
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
                console.log("buggerino6");
                name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'claimer', loc[0], loc[1], Game.spawns.Spawn1.room.name);
                if (name) {
                  Memory.claims.claimClaimers[i].push(name);
                  console.log(numberOfClaimers + 1, "/", "Spawning new claimer!", name);
                }
              }
            }
          }
        } else {
          console.log("buggerino5");
          name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'claimer', loc[0], loc[1], Game.spawns.Spawn1.room.name);
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
        console.log(roleCnt.upgrader + 1, "/", minimumNumberOfBuilders, "Spawning new builder!", name);
      }
    } else if (energy >= 200 && roleCnt.upgrader < minimumNumberOfUpgraders) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'upgrader');
      if (name) {
        console.log(roleCnt.upgrader + 1, "/", minimumNumberOfUpgraders, "Spawning new upgrader!", name);
      }
    } else if (energy >= 200 && makeAttackUnitsLowPriority) {
      name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'fighter', 1, 1, 1, "0", Game.spawns.Spawn1.room.name);
      if (name) {
        console.log(roleCnt.fighter + 1, "/", "Spawning new fighter!", name);
      }
    }
  }

  return loop;

})();


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
