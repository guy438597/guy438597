/*jshint esversion: 6, -W041, -W080, -W018, -W004 */
var costEfficientMove = require('command.costEfficientMove');
var findEnergy = require('command.findEnergy');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var getDistance = require('command.getDistance');
var getDistanceInTicks = require('command.getDistanceInTicks');
var chooseClosest = require('command.chooseClosest');

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        var target;

        //transition from old system, delete in a few hours:
        if (creep.memory.state == 'idle') {
            creep.memory.state = "miningEnergy";
        }


        // when the creep just spawned
        if (creep.memory.state == undefined) {
            creep.memory.state = "miningEnergy";
            if (creep.memory.target != undefined) {
                target = Game.getObjectById(creep.memory.target);
                creep.memory.target = target.id;
            }
        }

        //console.log(creep,creep.memory.state, creep.carry.energy >= creep.carryCapacity);

        //console.log(creep.carry.energy, creep.carryCapacity);
        if (creep.memory.state != "puttingEnergyInContainer" && creep.memory.state != "lookingForNearbyEnergy" && creep.carry.energy >= creep.carryCapacity) {
            creep.memory.state = "puttingEnergyInContainer";
            creep.memory.target = undefined;
            //target = undefined;
        } else if (creep.memory.state != "miningEnergy" && creep.memory.state != "lookingForNearbyEnergy" && creep.carry.energy == 0) {
            creep.memory.state = "miningEnergy";
            creep.memory.target = creep.memory.source;
            //target = undefined;
        }


        //console.log("yolo", creep.memory.state, creep.memory.target);


        if (creep.memory.state == "miningEnergy") {
            if (creep.memory.target != undefined) {
                target = Game.getObjectById(creep.memory.target);
            } else {
                creep.memory.target = creep.memory.source;
                target = Game.getObjectById(creep.memory.source);
            }
        }

        // go mining
        if (creep.memory.state == 'miningEnergy') {
            // if target available -> go to room, if not already in room -> go mining
            if (target != undefined) {
                if (target.room.name != creep.room.name) {
                    creep.memory.target = target.id;
                    creep.say("GOING MINING");
                    costEfficientMove(creep, target);
                } else {
                    if (creep.harvest(target) == ERR_NOT_IN_RANGE || creep.harvest(target) == ERR_NOT_ENOUGH_RESOURCES) {
                        // move towards the source
                        creep.memory.target = target.id;
                        costEfficientMove(creep, target);
                    }
                    //console.log("hi2");
                }
            }
            // if target unavailable??????? wait i guess
            else {
                //creep.memory.state = 'puttingEnergyInContainer';
                //console.log("MINER TARGET UNDEFINED!");
            }
        }
        // pick up nearby energy until none found or full inventory
        if (creep.memory.state == "lookingForNearbyEnergy") {
            //console.log("testerino");
            var temp = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, {
                filter: (s) => creep.pos.getRangeTo(s.pos) <= 2
            });
            if (temp != undefined) {
                target = temp;
            }
            //target = findEnergy(creep, 1, 2, "pickupEnergy");
            // found energy? pick it up
            if (target != undefined) {
                if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
                    // move towards the source
                    creep.say(target.amount, "PICKUP ENRGY");
                    creep.memory.target = target.id;
                    costEfficientMove(creep, target);
                }
            }
            //if nothing found, then put target back to undefined, and change states to mining
            else {
                if (creep.carry.energy >= creep.carryCapacity) {
                    creep.memory.state = 'puttingEnergyInContainer';
                } else {
                    creep.memory.state = "miningEnergy";
                }
            }
        }
        // full inventory -> want to drop energy to container or on ground
        if (creep.memory.state == 'puttingEnergyInContainer') {
            //try find a container
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && s.pos.getRangeTo(creep.pos) <= 2
            });
            // if one is found -> if it is full, then drop to ground, else drop it to container
            if (target != undefined) {
                if (_.sum(target.store) < target.storeCapacity) {
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        //console.log(creep.pos.getRangeTo(structure));
                        // move towards it
                        creep.say("PUT CONTR");
                        costEfficientMove(creep, target);
                    }
                } else {
                    //console.log(creep.carry.energy, creep.pos, target, creep.memory.state);
                    creep.say("CNTNR FULL");
                    creep.drop(RESOURCE_ENERGY);
                    creep.memory.target = undefined;
                    creep.memory.state = 'miningEnergy';
                }
                if (Memory.structures != undefined) {
                    if (Memory.structures.miningContainers != undefined) {
                        //console.log(typeof objectWithDraw.id);
                        if (target.structureType == STRUCTURE_CONTAINER) {
                            if (Memory.structures.miningContainers.indexOf(target.id) == -1) {
                                Memory.structures.miningContainers.push(target.id);
                                console.log("Added container structure to memory!", target.id);
                            }
                        }
                    } else {
                        Memory.structures.miningContainers = [];
                    }
                } else {
                    Memory.structures = {};
                }

            } else if (target == undefined) {
                target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
                    filter: (s) => s.pos.getRangeTo(creep.pos) <= 1
                });
                if (target != undefined) {
                    if (creep.build(target) == ERR_NOT_IN_RANGE) {
                        creep.say("BLD " + target.pos.x + " " + target.pos.y);
                        //creep.memory.target = target.id;
                        costEfficientMove(creep, target);
                    }
                } else {
                    creep.say("NO CONTNR");
                    creep.drop(RESOURCE_ENERGY);
                    creep.memory.target = undefined;
                    creep.memory.state = 'miningEnergy';
                }
            }
        }
    }
};
