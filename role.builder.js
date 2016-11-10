/*jshint esversion: 6, -W041, -W080, -W018, -W004 */
var costEfficientMove = require('command.costEfficientMove');
var findEnergy = require('command.findEnergy');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var getDistance = require('command.getDistance');
var getDistanceInTicks = require('command.getDistanceInTicks');
var chooseClosest = require('command.chooseClosest');

module.exports = {
    /*Priority list of builder guy:
    - build closest stuff first
    - has priority list:
    - storage > container > spawn > extension > tower > rest
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
        //console.log("lul", typeof STRUCTURE_CONTAINER, priorityDictionary[STRUCTURE_CONTAINER]);

        // load the one from memory - if memory inaccessable (probably newly spawned creep) -> load default one

        if (creep.memory.retreatRoom == undefined) {
            creep.memory.retreatRoom = Game.spawns.Spawn1.room.name;
        }

        if (creep.memory.state == undefined) {
            creep.memory.target = undefined;
            creep.memory.state = "pickupEnergy";
        }

        if (creep.memory.state != "dying" && creep.ticksToLive <= 50 && getDistanceInTicks(creep, findEnergy(creep, creep.carry.energy, undefined, STRUCTURE_CONTAINER, "transfer")) < 50) {
            creep.memory.target = undefined;
        } else if (creep.memory.state != "dying" && creep.memory.state != "working" && creep.carry.energy == creep.carryCapacity) {
            creep.memory.target = undefined;
            creep.memory.state = "working";
        } else if (creep.memory.state != "dying" && creep.memory.state != "pickupEnergy" && creep.carry.energy == 0) {
            creep.memory.target = undefined;
            creep.memory.state = "pickupEnergy";
        }

        if (creep.memory.target != undefined) {
            target = Game.getObjectById(creep.memory.target);
            //console.log(target);
        }

        //if enemy in room -> retreat
        if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0) {
            creep.say("RETREAT!");
            costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.retreatRoom));
        } else if (creep.memory.state == "working") {
            if (target == undefined) {
                var tempTarget;
                var distance;
                var tempDistance;
                var priority;
                var tempPriority;
                if (Memory.structures != undefined && Memory.structures.buildingSites != undefined) {
                    for (let tempTargetID of Memory.structures.buildingSites) {
                        tempTarget = Game.getObjectById(tempTargetID);
                        if (tempTarget == null) {
                            if (Memory.structures.buildingSites.indexOf(tempTargetID) != -1) {
                                Memory.structures.buildingSites.splice(tempTargetID, 1);
                            }
                            creep.memory.target = undefined;
                            continue;
                        }
                        if (target == undefined) {
                            target = tempTarget;
                            distance = getDistance(creep, tempTarget);
                            priority = priorityDictionary[tempTarget.structureType] || 0;
                        } else {
                            var structtype = tempTarget.structureType;
                            tempPriority = priorityDictionary[tempTarget.structureType] || 0;
                            tempDistance = getDistance(creep, tempTarget);
                            //console.log(target.structureType, priority, tempPriority, distance, tempDistance);
                            if (tempPriority > priority || tempPriority >= priority && tempDistance < distance) {
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
                    if (Memory.structures.buildingSites.indexOf(creep.memory.target) != -1) {
                        Memory.structures.buildingSites.splice(creep.memory.target, 1);
                    }
                    creep.memory.target = undefined;
                } else if (target.progress != target.progressTotal && target.room != undefined) {
                    creep.memory.target = target.id;
                    if (creep.build(target) == ERR_NOT_IN_RANGE) {
                        creep.say("BLD " + target.pos.x + " " + target.pos.y);
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
            if (target != undefined && target.structureType != undefined && _.sum(target.store) < creep.carryCapacity - creep.carry.energy) {
                target = undefined;
                creep.memory.target = undefined;
            }
            // ALWAYS try to pick up energy from nearby, because it expires
            var temp = findEnergy(creep, 200, 5, "pickupEnergy");
            if (temp != undefined) {
                target = temp;
            }
            // find closest container / storage to pick up energy from
            if (target == undefined) {
                target = findEnergy(creep, creep.carryCapacity - creep.carry.energy, undefined, STRUCTURE_CONTAINER, "withdraw");
                target2 = findEnergy(creep, creep.carryCapacity - creep.carry.energy, undefined, STRUCTURE_STORAGE, "withdraw", Memory.structures.miningContainers);
                //choose the closest one out of target and target2
                target = chooseClosest(creep, [target, target2]);
                if (target == undefined) {
                    target = findEnergy(creep, 200, 100, "pickupEnergy");
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
                    creep.say("GRAB " + target.pos.x + " " + target.pos.y);
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
