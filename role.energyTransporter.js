/*jshint esversion: 6, -W041, -W080, -W018, -W083 */
var costEfficientMove = require('command.costEfficientMove');
var findEnergy = require('command.findEnergy');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var getDistance = require('command.getDistance');
var getDistanceInTicks = require('command.getDistanceInTicks');
var chooseClosest = require('command.chooseClosest');

module.exports = {
    /* The purpose of this role:
    if you have at least 1 container next to mining sources, and one container acting as storage (>3 range away from energy source)
    the transporter will spawn to carry energy from miningContainers to storageContainers or storages
    how many will spawn, depends on the distance between miningContainers and the next free storageContainer
    */

    run: function(creep) {
        //idea for this creep: move to mining container (dedicated container per transporter)
        //then move energy content to storage, so lvl 4 required!
        var source;
        var target;


        if (creep.memory.retreatRoom == undefined) {
            creep.memory.retreatRoom = Game.spawns.Spawn1.room.name;
        }

        // load the one from memory - if memory inaccessable (probably newly spawned creep) -> load default one
        if (creep.memory.state == undefined) {
            creep.memory.target = undefined;
            creep.memory.state = "pickupEnergy";
        }


        //settings states, depending on ticksToLive and how much energy the creep is carrying
        if (creep.memory.state != "dying" && creep.ticksToLive <= 50) {
            creep.memory.target = undefined;
            creep.memory.state = "dying";
        } else if (creep.memory.state != "dying" && creep.memory.state != "deliverEnergy" && creep.carry.energy == creep.carryCapacity) {
            creep.memory.target = undefined;
            creep.memory.state = "deliverEnergy";
        } else if (creep.memory.state != "dying" && creep.memory.state != "pickupEnergy" && creep.memory.state != "grabbingNearbyEnergy" && creep.carry.energy == 0) {
            creep.memory.target = undefined;
            creep.memory.state = "pickupEnergy";
        }
        // load the game object

        if (creep.memory.state == "pickupEnergy" && creep.memory.target == undefined) {
            creep.memory.target = creep.memory.source;
            //console.log(Game.getObjectById(creep.memory.target).pos);
        }


        if (creep.memory.source != undefined) {
            source = Game.getObjectById(creep.memory.source);
        }


        if (creep.memory.target != undefined) {
            target = Game.getObjectById(creep.memory.target);
            if (target == undefined) {
                creep.memory.target = undefined;
                target = undefined;
            }
        }

        //if enemy in room -> retreat
        if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0) {
            creep.say("RETREAT!");
            costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.retreatRoom));
        }
        // go near the energySource and find nearby dropped energy and miningContainer near mining source
        else if (creep.memory.state == "pickupEnergy") {
            if (target != undefined) {
                var temp = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, {
                    filter: (s) => creep.pos.getRangeTo(s.pos) <= 2
                });
                if (temp != undefined) {
                    creep.memory.state = "grabbingNearbyEnergy";
                    creep.memory.target = temp.id;
                    //console.log("test", creep.memory.state, creep.memory.target, target.pos);
                } else if (source.room != creep.room) {
                    creep.memory.target = source.id;
                    creep.say("GRAB " + source.room.name);
                    costEfficientMove(creep, source);
                } else if (creep.pos.getRangeTo(source.pos) <= 4) {
                    //console.log(target.pos);
                    temp = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && s.pos.getRangeTo(creep.pos) <= 5 && _.sum(s.store) > creep.carryCapacity - creep.carry.energy
                    }); //Memory.structures.miningContainers);
                    if (temp != undefined) {
                        if (creep.withdraw(temp, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.memory.target = temp.id;
                            creep.say("GRAB E " + temp.pos.x + " " + temp.pos.y);
                            costEfficientMove(creep, target);
                        }
                    } else {
                        creep.say("AVOIDING");
                        moveOutOfTheWay(creep);
                    }
                } else {
                    //console.log("hi", target);
                    //console.log(creep.pos, target);
                    costEfficientMove(creep, source);
                }
            }else {
                creep.memory.target = creep.memory.source;
            }
        }

        // if nearby dropped energy is found, do this
        else if (creep.memory.state == "grabbingNearbyEnergy") {

            if (target == undefined) {
                creep.memory.state = "pickupEnergy";
                creep.memory.target = undefined;
            }
            else if (target != undefined) {
                if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
                    creep.memory.target = target.id;
                    creep.say(target.amount + " PICKUP");
                    costEfficientMove(creep, target);
                    //if there is an error picking up the energy, its probably because it either expired or it was already picked up
                } else {
                    creep.memory.state = "pickupEnergy";
                    creep.memory.target = undefined;
                }
            }
        }

        // now the transporter has full energy loaded, now its trying to find first a storage, then a container which is not a miningContainer
        else if (creep.memory.state == "deliverEnergy") {
            if (target != undefined && target.energyCapacity - target.energy < creep.carry.energy) {
                target = undefined;
            }
            //always try to deliver energy to storage first, before trying to deliver to container
            if (target == undefined) {
                target = findEnergy(creep, creep.carry.energy, undefined, STRUCTURE_STORAGE, "transfer", Memory.structures.miningContainers);
                target2 = findEnergy(creep, creep.carry.energy, undefined, STRUCTURE_CONTAINER, "transfer", Memory.structures.miningContainers);
                target = chooseClosest(creep, [target, target2]);
                //console.log(creep, creep.carry.energy, 300, STRUCTURE_CONTAINER, "transfer", Memory.structures.miningContainers);
                //console.log(target);
            }

            if (target != undefined) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.say("DLVR " + target.pos.x + " " + target.pos.y);
                    creep.memory.target = target.id;
                    costEfficientMove(creep, target);
                }
            } else {
                creep.memory.target = undefined;
            }
        }

        // in case the creep is dying, we dont want him to die and leave energy on the ground - instead bring all the energy to nearest storage
        else if (creep.memory.state == "dying") {
            // when dying, try to transfer energy to nearby storage
            if (creep.carry.energy == 0) {
                creep.say("DYING");
                moveOutOfTheWay(creep);
            } else if (target == undefined) {
                target = findEnergy(creep, creep.carry.energy, undefined, STRUCTURE_CONTAINER, "transfer", Memory.structures.miningContainers);
                target2 = findEnergy(creep, creep.carry.energy, undefined, STRUCTURE_STORAGE, "transfer", Memory.structures.miningContainers);
                target = chooseClosest(creep, [target, target2]);
            }
            if (target != undefined) {
                creep.say("DYING");
                var error = creep.transfer(target);
                if (error == ERR_NOT_IN_RANGE) {
                    costEfficientMove(creep, target);
                }
            }
        }
    }
};
