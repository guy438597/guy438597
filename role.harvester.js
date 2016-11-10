/*jshint esversion: 6, -W041, -W080, -W018 */
var costEfficientMove = require('command.costEfficientMove');
var findEnergy = require('command.findEnergy');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var getDistance = require('command.getDistance');
var getDistanceInTicks = require('command.getDistanceInTicks');
var chooseClosest = require('command.chooseClosest');

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        // if creep is bringing energy to a structure but has no energy left
        var target;

        if (creep.memory.state == undefined) {
            creep.memory.state = "mining";
        }
        if (creep.memory.target != undefined) {
            target = Game.getObjectById(creep.memory.target);
        }

        if (creep.memory.state != "findingTarget" && creep.carry.energy == creep.carryCapacity) {
            creep.memory.state = "findingTarget";
            creep.memory.target = undefined;
        }
        if (creep.memory.state != "mining" && creep.carry.energy == 0) {
            creep.memory.state = "mining";
            creep.memory.target = undefined;
        }

        if (creep.memory.state == "mining") {
            if (target == undefined) {
                target = creep.pos.findClosestByPath(FIND_SOURCES);
            }
            if (target != undefined) {
                if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                    // move towards the source
                    creep.memory.target = target.id;
                    creep.moveTo(target);
                }
            }
        }

        if (creep.memory.state == "findingTarget") {
            if (target == undefined) {
                target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity
                });
                if (target != undefined) {
                    creep.memory.state = "transferingEnergy";
                }
            } else if (target == undefined) {
                target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
                    filter: (s) => (s.structureType != STRUCTURE_ROAD)
                });
                if (target != undefined) {
                    creep.memory.state = "building";
                }
            }
        }

        if (creep.memory.state == "transferingEnergy") {
            if (target != undefined) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.say("TRNSFR " + target.structureType);
                    costEfficientMove(creep, target);
                }
            } else {
                creep.memory.state = undefined;
            }
        }
        if (creep.memory.state == "building") {
            if (target != undefined) {
                if (creep.build(target) == ERR_NOT_IN_RANGE) {
                    creep.say("BUILD " + target.structureType);
                    costEfficientMove(creep, target);
                }
            } else {
                creep.memory.state = undefined;
            }
        }
    }
};
