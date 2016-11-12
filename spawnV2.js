module.exports = function() {
  return StructureSpawn.prototype.createCustomCreepV2 = function(energy, roleName, arg1, arg2, arg3, arg4, arg5) {
    var body, costDictionary, hitpoints, i, j, k, l, m, n, numberOfParts, o, p, q, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
    if (arg1 == null) {
      arg1 = "0";
    }
    if (arg2 == null) {
      arg2 = "0";
    }
    if (arg3 == null) {
      arg3 = "0";
    }
    if (arg4 == null) {
      arg4 = "0";
    }
    if (arg5 == null) {
      arg5 = "0";
    }
    console.log("spawning!");
    costDictionary = {
      WORK: 100,
      CARRY: 50,
      MOVE: 50,
      TOUGH: 10,
      ATTACK: 80,
      CLAIM: 600
    };
    body = [];
    numberOfParts = 0;
    hitpoints = 0;
    if (roleName === "harvester" && energy >= 200) {
      return this.createCreep([WORK, MOVE, CARRY], void 0, {
        role: roleName
      });
    } else if (roleName === "sourceMiner" && energy >= 200) {
      numberOfParts = Math.floor((energy - 100) / 100);
      numberOfParts = Math.min(5, numberOfParts);
      body.push(CARRY);
      body.push(MOVE);
      if (numberOfParts) {
        for (i = j = 1, ref = numberOfParts; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
          body.push(WORK);
        }
      }
      return this.createCreep(body, void 0, {
        role: roleName,
        energySourceID: arg1,
        energySourceRoomName: arg2
      });
    } else if (roleName === "builder" && energy >= 300) {
      numberOfParts = Math.floor((energy - 300) / 50);
      numberOfParts = Math.min(5, numberOfParts);
      body.push(CARRY);
      body.push(CARRY);
      body.push(MOVE);
      body.push(MOVE);
      body.push(WORK);
      if (numberOfParts) {
        for (i = k = 1, ref1 = numberOfParts; 1 <= ref1 ? k <= ref1 : k >= ref1; i = 1 <= ref1 ? ++k : --k) {
          body.push(CARRY);
        }
      }
      return this.createCreep(body, void 0, {
        role: roleName
      });
    } else if (roleName === "upgrader" && energy >= 200) {
      numberOfParts = Math.floor((energy - 100) / 100);
      numberOfParts = Math.min(4, numberOfParts);
      body.push(MOVE);
      body.push(CARRY);
      if (numberOfParts) {
        for (i = l = 1, ref2 = numberOfParts; 1 <= ref2 ? l <= ref2 : l >= ref2; i = 1 <= ref2 ? ++l : --l) {
          body.push(WORK);
        }
      }
      return this.createCreep(body, void 0, {
        role: roleName
      });
    } else if (roleName === "energyRefiller" && energy >= 300) {
      numberOfParts = Math.floor((energy - 150) / 150);
      console.log(numberOfParts);
      numberOfParts = Math.min(2, numberOfParts);
      console.log(numberOfParts);
      body.push(MOVE);
      body.push(CARRY);
      body.push(CARRY);
      if (numberOfParts) {
        for (i = m = 1, ref3 = numberOfParts; 1 <= ref3 ? m <= ref3 : m >= ref3; i = 1 <= ref3 ? ++m : --m) {
          body.push(MOVE);
          body.push(CARRY);
          body.push(CARRY);
        }
      }
      console.log(body, energy, numberOfParts);
      return this.createCreep(body, void 0, {
        role: roleName
      });
    } else if (roleName === "energyTransporter" && energy >= 150) {
      numberOfParts = Math.floor((energy - 150) / 150);
      numberOfParts = Math.min(10, numberOfParts);
      body.push(MOVE);
      body.push(CARRY);
      body.push(CARRY);
      if (numberOfParts) {
        for (i = n = 1, ref4 = numberOfParts; 1 <= ref4 ? n <= ref4 : n >= ref4; i = 1 <= ref4 ? ++n : --n) {
          body.push(MOVE);
          body.push(CARRY);
          body.push(CARRY);
        }
      }
      console.log(body, numberOfParts, energy);
      return this.createCreep(body, void 0, {
        role: roleName,
        energySourceID: arg1,
        energySourceRoomName: arg2
      });
    } else if (roleName === "repairer" && energy >= 300) {
      numberOfParts = Math.floor((energy - 300) / 50);
      numberOfParts = Math.min(5, numberOfParts);
      body.push(CARRY);
      body.push(CARRY);
      body.push(MOVE);
      body.push(MOVE);
      body.push(WORK);
      if (numberOfParts) {
        for (i = o = 1, ref5 = numberOfParts; 1 <= ref5 ? o <= ref5 : o >= ref5; i = 1 <= ref5 ? ++o : --o) {
          body.push(CARRY);
        }
      }
      return this.createCreep(body, void 0, {
        role: roleName
      });
    } else if (roleName === "fighter" && energy >= 380) {
      numberOfParts = Math.floor((energy - 0) / 190);
      if (numberOfParts) {
        for (i = p = 1, ref6 = numberOfParts; 1 <= ref6 ? p <= ref6 : p >= ref6; i = 1 <= ref6 ? ++p : --p) {
          body.push(TOUGH);
        }
      }
      if (numberOfParts) {
        for (i = q = 1, ref7 = numberOfParts; 1 <= ref7 ? q <= ref7 : q >= ref7; i = 1 <= ref7 ? ++q : --q) {
          body.push(MOVE);
          body.push(ATTACK);
          body.push(MOVE);
        }
      }
      return this.createCreep(body, void 0, {
        role: roleName,
        roomToDefend: arg4,
        retreatRoom: arg5
      });
    } else if (roleName === "claimer" && energy >= 650) {
      numberOfParts = Math.floor((energy - 650) / 1);
      numberOfParts = Math.min(48, numberOfParts);
      body.push(CLAIM);
      body.push(MOVE);
      return this.createCreep(body, void 0, {
        role: roleName,
        claimRoomName: arg1,
        claimOption: arg2,
        retreatRoomName: arg3
      });
    } else if (roleName === "wallRepairer") {
      return this.createCreep([WORK, MOVE, CARRY], void 0, {
        role: roleName
      });
    }
  };
};
