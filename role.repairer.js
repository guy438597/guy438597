/*jshint esversion: 6, -W041, -W080, -W018, -W004 */
var costEfficientMove = require('command.costEfficientMove');
var findEnergy = require('command.findEnergy');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var getDistance = require('command.getDistance');
var getDistanceInTicks = require('command.getDistanceInTicks');
var chooseClosest = require('command.chooseClosest');

module.exports = {
    /*Priority list of worker guy:
    - He's gonna refill the spawn with energy, then refill extensions
    - then repair all structures except for towers and walls, if theyre below 50% hp
    - then build new stuff like roads, mines, new extensions etc
    - if then anything is remaining, he will go upgrade
    - only wall repairers are dedicated wall repairers (one guy) who will then become a refiller if idle
    */

    // a function to run the logic for this role
    run: function(creep) {
        var target;
        var priorityDictionary = {
            "storage": 10,
            "container": 9,
            "spawn": 8,
            "extension": 7,
            "tower": 6
        };

        // load the one from memory - if memory inaccessable (probably newly spawned creep) -> load default one
        if (creep.memory.retreatRoom == undefined) {
            creep.memory.retreatRoom = Game.spawns.Spawn1.room.name;
        }

        if (creep.memory.state != undefined) {
            state = creep.memory.state;
        } else {
            creep.memory.target = undefined;
            creep.memory.state = "pickupEnergy";
        }

        if (creep.memory.state != "dying" && creep.ticksToLive <= 50 && getDistanceInTicks(creep, findEnergy(creep, creep.carry.energy, undefined, STRUCTURE_CONTAINER, "transfer")) < 50) {
            creep.memory.target = undefined;
            creep.memory.state = "dying";
        } else if (creep.memory.state != "dying" && creep.memory.state != "working" && creep.carry.energy == creep.carryCapacity) {
            //creep.memory.target = undefined;
            creep.memory.state = "working";
        } else if (creep.memory.state != "dying" && creep.memory.state != "pickupEnergy" && creep.carry.energy == 0) {
            //creep.memory.target = undefined;
            creep.memory.state = "pickupEnergy";
        }

        if (creep.memory.target != undefined && creep.memory.state == "working") {
            target = Game.getObjectById(creep.memory.target);
            //console.log(target);
        }


        //if enemy in room -> retreat
        if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0) {
            creep.say("RETREAT!");
            costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.retreatRoom));
        }
        //creep.memory.target = undefined;
        // if creep is supposed to transfer energy to a structure
        else if (creep.memory.state == "working") {
            if (target == undefined) {
                var tempTarget;
                var distance;
                var tempDistance;
                var priority;
                var tempPriority;
                if (Memory.structures != undefined && Memory.structures.repairTargets != undefined) {
                    for (let tempTargetID of Memory.structures.repairTargets) {
                        tempTarget = Game.getObjectById(tempTargetID);
                        if (tempTarget == null) {
                            if (Memory.structures.repairTargets.indexOf(tempTarget.id) != -1) {
                                Memory.structures.repairTargets.splice(tempTarget.id, 1);
                            }
                            creep.memory.target = undefined;
                            continue;
                        }
                        if (target == undefined) {
                            target = tempTarget;
                            distance = getDistance(creep, tempTarget);
                            priority = priorityDictionary[tempTarget.structureType] || 0;
                        } else {
                            tempPriority = priorityDictionary[tempTarget.structureType] || 0;
                            tempDistance = getDistance(creep, tempTarget);
                            if (tempPriority >= priority && tempDistance < distance) {
                                target = tempTarget;
                                distance = tempDistance;
                                priority = tempPriority;
                            }
                        }
                    }
                }
            }
            if (target != undefined) {
                if (target == null) {
                    if (Memory.structures.repairTargets.indexOf(creep.memory.target) != -1) {
                        Memory.structures.repairTargets.splice(creep.memory.target, 1);
                    }
                    creep.memory.target = undefined;
                } else if (target.hits < target.hitsMax && target.room != undefined) {
                    creep.memory.target = target.id;
                    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                        // move towards it
                        creep.say("REP " + target.pos);
                        costEfficientMove(creep, target);
                    }
                } else {
                    creep.memory.state = undefined;
                    creep.memory.target = undefined;
                }
            } else {
                creep.say("AVOIDING");
                moveOutOfTheWay(creep);
            }
        } else if (creep.memory.state == "pickupEnergy") {
            if (target != undefined && target.structureType != undefined && target.energy < creep.carryCapacity - creep.carry.energy) {
                target = undefined;
            }
            // ALWAYS try to pick up energy from nearby, because it expires
            var temp = findEnergy(creep, 150, 10, "pickupEnergy");
            if (temp != undefined) {
                target = temp;
            }
            // find closest container / storage to pick up energy from
            if (target == undefined) {
                target = findEnergy(creep, creep.carryCapacity - creep.carry.energy, undefined, STRUCTURE_CONTAINER, "withdraw", Memory.structures.miningContainers);
                target2 = findEnergy(creep, creep.carryCapacity - creep.carry.energy, undefined, STRUCTURE_STORAGE, "withdraw", Memory.structures.miningContainers);
                //choose the closest one out of target and target2
                target = chooseClosest(creep, [target, target2]);
                if (target == undefined) {
                    target = findEnergy(creep, 150, 100, "pickupEnergy");
                }
            }
            //if we found a target obviously -> move to it and grab energy
            if (target != undefined) {
                //trying to find out if its dropped energy -> then pick it up
                if (target.structureType == undefined) {
                    if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
                        creep.say(target.amount + " PICKUP");
                        creep.memory.target = target.id;
                        costEfficientMove(creep, target);
                    }
                }
                //we already know that it is a structure (container / storage) so we are gonna withdraw from it
                else if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.say("GRAB E " + target.pos);
                    creep.memory.target = target.id;
                    costEfficientMove(creep, target);
                }
            }
        } else if (creep.memory.state == "dying") {
            // when dying, try to transfer energy to nearby storage
            if (creep.carry.energy == 0) {
                creep.say("DYING");
                moveOutOfTheWay(creep);
            } else if (target == undefined) {
                target = findEnergy(creep, creep.carry.energy, undefined, STRUCTURE_CONTAINER, "transfer");
                target2 = findEnergy(creep, creep.carry.energy, undefined, STRUCTURE_STORAGE, "transfer");
                target = chooseClosest(creep, [target, target2]);
            } else if (target != undefined) {
                console.log(creep.pos, "dying, moving to", target.pos, "to deliver energy before rip", target);
                creep.say("DYING");
                //var error = ;
                if (getDistance(creep, target) > 1) {
                    costEfficientMove(creep, target);
                } else {
                    creep.transfer(target);
                }
            }
        }
    }
};
