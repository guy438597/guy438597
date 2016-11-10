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
        var state;

        if (creep.memory.retreatRoom == undefined) {
            creep.memory.retreatRoom = Game.spawns.Spawn1.room.name;
        }

        // load the one from memory - if memory inaccessable (probably newly spawned creep) -> load default one
        if (creep.memory.state == undefined) {
            creep.memory.target = undefined;
            creep.memory.state = "pickupEnergy";
        }

        if (creep.memory.state != "dying" && creep.ticksToLive == 50) {
            creep.memory.target = undefined;
            creep.memory.state = "dying";
        } else if (creep.memory.state != "dying" && creep.memory.state != "deliverEnergy" && creep.carry.energy == creep.carryCapacity) {
            creep.memory.target = undefined;
            creep.memory.state = "deliverEnergy";
        } else if (creep.memory.state != "dying" && creep.memory.state != "pickupEnergy" && creep.carry.energy == 0) {
            creep.memory.target = undefined;
            creep.memory.state = "pickupEnergy";
        }

        if (creep.memory.target != undefined) {
            target = Game.getObjectById(creep.memory.target);
            //console.log(target);
        }



        if (creep.memory.state == "pickupEnergy") {
            /*if (target != undefined && target.structureType != undefined && target.energy < target.energyCapacity){
                target = undefined;
            }*/
            // ALWAYS try to pick up energy from nearby, because it expires
            var temp = findEnergy(creep, 50, 5, "pickupEnergy");
            if (temp != undefined) {
                target = temp;
            }
            // find closest container / storage to pick up energy from
            if (target == undefined) {
                target = findEnergy(creep, creep.carryCapacity - creep.carry.energy, undefined, STRUCTURE_CONTAINER, "withdraw", Memory.structures.miningContainers);
                target2 = findEnergy(creep, creep.carryCapacity - creep.carry.energy, undefined, STRUCTURE_STORAGE, "withdraw", Memory.structures.miningContainers);
                //choose the closest one out of target and target2
                //console.log(creep.pos, creep.memory.role, target, target2);
                //console.log(creep.memory.role, target, target2);
                target = chooseClosest(creep, [target, target2]);
                if (target == undefined) {
                    target = findEnergy(creep, creep.carryCapacity - creep.carry.energy, undefined, STRUCTURE_CONTAINER, "withdraw");
                    target2 = findEnergy(creep, creep.carryCapacity - creep.carry.energy, undefined, STRUCTURE_STORAGE, "withdraw");
                    target = chooseClosest(creep, [target, target2]);
                    if (target == undefined) {
                        target = findEnergy(creep, 100, 100, "pickupEnergy");
                    }
                }
            }
            //if we found a target obviously -> move to it and grab energy
            if (target != undefined) {
                //trying to find out if its dropped energy -> then pick it up
                if (target.structureType == undefined) {
                    if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
                        creep.memory.target = target.id;
                        creep.say(target.amount + " PICKUP");
                        costEfficientMove(creep, target);
                    }
                }
                //we already know that it is a structure (container / storage) so we are gonna withdraw from it
                else if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.memory.target = target.id;
                    creep.say("GRAB E " + target.pos);
                    costEfficientMove(creep, target);
                }
            } else {
                creep.say("AVOIDING");
                moveOutOfTheWay(creep);
            }
        }
        // if we have energy in inventory -> deliver energy to extension / spawn / tower in this order
        else if (creep.memory.state == "deliverEnergy") {
            // if target is already full, choose new target
            if (target != undefined && target.energy == target.energyCapacity) {
                target = undefined;
            }
            if (target == undefined) {
                target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity
                });
            }
            if (target == undefined) {
                target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_SPAWN) && s.energy < s.energyCapacity
                });
            }
            if (target == undefined) {
                target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_TOWER) && s.energy < s.energyCapacity
                });
            }

            if (target != undefined) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.say("ENRGY " + target.structureType);
                    creep.memory.target = target.id;
                    costEfficientMove(creep, target);
                }
            } else {
                creep.say("AVOIDING");
                moveOutOfTheWay(creep);
            }
        }
        // if creep is dying, we want to transfer the remaining energy to a nearby storage / container before it gets put to the ground
        else if (creep.memory.state == "dying") {
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
