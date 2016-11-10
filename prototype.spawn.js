/*jshint esversion: 6, -W041, -W080, -W018 */

module.exports = function() {
    // create a new function for StructureSpawn
    StructureSpawn.prototype.createCustomCreepV2 =
        function(energy, roleName, arg1, arg2, arg3, arg4, arg5) {
            arg1 = arg1 || "0";
            arg2 = arg2 || "0";
            arg3 = arg3 || "0";
            arg4 = arg4 || "0";
            arg5 = arg5 || "0";
            costDictionary = {
                WORK: 100,
                CARRY: 50,
                MOVE: 50,
                TOUGH: 10,
                ATTACK: 80,
                CLAIM: 600
            };
            // create a balanced body as big as possible with the given energy
            /*
            cost of body parts are:
            WORK = 100
            CARRY = 50
            MOVE = 50
            ATTACK = 50
            RANGED_ATTACK = 150
            HEAL = 250
            TOUGH = 10
            */
            var body = [];
            var numberOfParts = 0;
            var hitpoints = 0;
            if (roleName == "harvester") {
                return this.createCreep([WORK, MOVE, CARRY], undefined, {
                    role: roleName
                });
            } else if (roleName == "sourceMiner" && energy >= 200) {
                numberOfParts = _.floor((energy - 100) / 100);
                numberOfParts = Math.min(6, numberOfParts);
                body.push(CARRY);
                body.push(MOVE);
                for (let i = 0; i < numberOfParts; i++) {
                    body.push(WORK);
                }
                return this.createCreep(body, undefined, {
                    role: roleName,
                    state: 'idle',
                    source: arg1,
                    energySourceRoom: arg2
                });
            } else if (roleName == "builder" && energy >= 300) {
                numberOfParts = _.floor((energy - 300) / 50);
                numberOfParts = Math.min(5, numberOfParts);
                body.push(CARRY);
                body.push(CARRY);
                body.push(MOVE);
                body.push(MOVE);
                body.push(WORK);
                for (let i = 0; i < numberOfParts; i++) {
                    body.push(CARRY);
                }
                return this.createCreep(body, undefined, {
                    role: roleName,
                    state: 'idle'
                });
            } else if (roleName == "upgrader" && energy >= 200) {
                numberOfParts = _.floor((energy - 100) / 100);
                //console.log(energy, numberOfParts);
                numberOfParts = Math.min(4, numberOfParts);
                body.push(MOVE);
                body.push(CARRY);
                for (let i = 0; i < numberOfParts; i++) {
                    body.push(WORK);
                }
                return this.createCreep(body, undefined, {
                    role: roleName,
                    state: 'idle'
                });
            } else if (roleName == "energyRefiller" && energy >= 300) {
                numberOfParts = _.floor((energy - 100) / 200);
                numberOfParts = Math.min(2, numberOfParts);
                body.push(MOVE);
                body.push(CARRY);
                body.push(CARRY);
                for (let i = 0; i < numberOfParts; i++) {
                    body.push(MOVE);
                    body.push(CARRY);
                    body.push(CARRY);
                }
                return this.createCreep(body, undefined, {
                    role: roleName,
                    state: 'idle'
                });
            } else if (roleName == "energyTransporter" && energy >= 150) {
                numberOfParts = _.floor((energy - 150) / 150);
                numberOfParts = Math.min(10, numberOfParts);
                body.push(MOVE);
                body.push(CARRY);
                body.push(CARRY);
                for (let i = 0; i < numberOfParts; i++) {
                    body.push(MOVE);
                    body.push(CARRY);
                    body.push(CARRY);
                }
                return this.createCreep(body, undefined, {
                    role: roleName,
                    state: 'idle',
                    source: arg1
                });
            } else if (roleName == "repairer" && energy >= 300) {
                numberOfParts = _.floor((energy - 300) / 50);
                numberOfParts = Math.min(5, numberOfParts);
                body.push(CARRY);
                body.push(CARRY);
                body.push(MOVE);
                body.push(MOVE);
                body.push(WORK);
                for (let i = 0; i < numberOfParts; i++) {
                    body.push(CARRY);
                }
                //Game.spawns.Spawn1.createCreep([WORK,MOVE,CARRY], undefined, {role: 'repairer', state: 'idle'})
                return this.createCreep(body, undefined, {
                    role: roleName,
                    state: 'idle'
                });
            } else if (roleName == "fighter" && energy >= 300) {
                numberOfToughParts = arg1;
                numberOfMoveParts = arg2;
                numberOfAttackParts = arg3;
                var cost = costDictionary[ATTACK] * numberOfAttackParts + costDictionary[MOVE] * numberOfMoveParts + costDictionary[TOUGH] * numberOfToughParts;
                console.log("SPAWN FIGHTER", cost, energy);
                if (energy <= cost) {
                    for (let i = 0; i < numberOfToughParts; i++) {
                        body.push(TOUGH);
                    }
                    if (numberOfAttackParts <= numberOfMoveParts) {
                        for (let i = 0; i < numberOfAttackParts; i++) {
                            body.push(MOVE);
                            body.push(ATTACK);
                        }
                        for (let i = 0; i < numberOfMoveParts - numberOfAttackParts; i++) {
                            body.push(MOVE);
                        }
                    } else {
                        for (let i = 0; i < numberOfAttackParts; i++) {
                            body.push(ATTACK);
                            body.push(MOVE);
                        }
                        for (let i = 0; i < numberOfAttackParts - numberOfMoveParts; i++) {
                            body.push(ATTACK);
                        }
                    }
                } else {
                    numberOfParts = _.floor((energy - 0) / 150);
                    for (let i = 0; i < numberOfParts; i++) {
                        body.push(TOUGH);
                        body.push(TOUGH);
                    }
                    for (let i = 0; i < numberOfParts; i++) {
                        body.push(MOVE);
                        body.push(ATTACK);
                    }

                }
                return this.createCreep(body, undefined, {
                    role: roleName,
                    state: 'idle',
                    roomToDefend: arg4,
                    retreatRoom: arg5
                });
            } else if (roleName == "claimer" && energy >= 650) {
                numberOfParts = _.floor((energy - 650) / 1);
                numberOfParts = Math.min(48, numberOfParts);
                body.push(CLAIM);
                body.push(MOVE);
                return this.createCreep(body, undefined, {
                    role: roleName,
                    state: 'idle',
                    claimRoomName: arg1,
                    claimOption: arg2,
                    retreatRoomName: arg3
                });
            } else if (roleName == "wallRepairer") {
                return this.createCreep([WORK, MOVE, CARRY], undefined, {
                    role: roleName,
                    state: 'idle'
                });
            }


            // create creep with the created body and the given role

        };
};
