/*jshint esversion: 6, -W041, -W080, -W018, -W004 */
var costEfficientMove = require('command.costEfficientMove');
var findEnergy = require('command.findEnergy');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var getDistance = require('command.getDistance');
var chooseClosest = require('command.chooseClosest');

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        var target;
        //old version:
        if (creep.memory.working == false) {
            // switch state
            creep.memory.working = true;
        }
        if (creep.memory.state == 'miningEnergy' && creep.carry.energy == creep.carryCapacity && creep.carryCapacity > 0) {
            creep.memory.state = 'puttingEnergyInContainer';
        }
        if (creep.memory.state == 'puttingEnergyInContainer' && creep.carry.energy == 0){
            creep.memory.state = 'miningEnergy';
        }


        if (creep.memory.state == 'idle') {
            // switch state
            var structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                // the second argument for findClosestByPath is an object which takes
                // a property called filter which can be a function
                // we use the arrow operator to define it
                filter: (s) => (s.structureType == STRUCTURE_CONTAINER) &&
                    s.pos.getRangeTo(creep) <= 3
                });
            if (structure != undefined && structure != null) {
                var target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {filter: (s) => s.amount >= 1 && s.pos.getRangeTo(creep.pos) <= 2});

                if (target != undefined && target != null) {
                    if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
                        // move towards the source
                        creep.say(target.amount, "pick up");
                        costEfficientMove(creep, target);
                    }
                    else{
                        creep.memory.state = 'miningEnergy';
                    }
                }
                else {
                    creep.memory.state = 'miningEnergy';
                }
            }
            else {
                creep.memory.state = 'miningEnergy';
            }
        }


        // if creep is supposed to transfer energy to a structure
        if (creep.memory.state == 'miningEnergy') {
            // find closest source
            //console.log(creep.memory.ene);
            if (creep.memory.energySourceID != "0"){
                target = Game.getObjectById(creep.memory.energySourceID);
                //console.log(target);

                //console.log(creep.harvest(target));
                if (creep.harvest(target) == ERR_NOT_IN_RANGE || creep.harvest(target) == ERR_NOT_ENOUGH_RESOURCES) {
                    // move towards the source
                    costEfficientMove(creep, target);
                }
                else if(creep.harvest(target) == ERR_INVALID_TARGET && creep.room.name != new RoomPosition(25, 25, creep.memory.energySourceRoom).roomName){
                    creep.say("Mining");
                    //console.log("Move Mining", creep, creep.pos);
                    target = costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.energySourceRoom));
                }
                else{
                    if (creep.harvest(target) != "0" && creep.harvest(target) != "-4"){
                        console.log("Error with miner:", creep.name, creep.harvest(target));
                    }
                    target = creep.pos.findClosestByPath(FIND_SOURCES);
                    // try to harvest energy, if the source is not in range
                    if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                        // move towards the source
                        creep.say("Mining");
                        costEfficientMove(creep, target);
                    }
                }
            }
        }
        else if (creep.memory.state == 'puttingEnergyInContainer'){
            var structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                // the second argument for findClosestByPath is an object which takes
                // a property called filter which can be a function
                // we use the arrow operator to define it
                filter: (s) => (s.structureType == STRUCTURE_CONTAINER) &&
                    s.pos.getRangeTo(creep) <= 3
                });

            if (structure != undefined){
                if (Memory.structures != undefined){
                    if (Memory.structures.miningContainers != undefined){
                        //console.log(typeof objectWithDraw.id);
                        if (Memory.structures.miningContainers.indexOf(structure.id) == -1){
                            Memory.structures.miningContainers.push(structure.id);
                            console.log("Added container structure to memory!", structure.id);
                        }
                    }
                    else{
                        Memory.structures.miningContainers = [];
                    }
                }
                else{
                    Memory.structures = {};
                }

                if (structure.store[RESOURCE_ENERGY] < structure.storeCapacity){
                    if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        //console.log(creep.pos.getRangeTo(structure));
                        // move towards it
                        creep.say("Put Container");
                        costEfficientMove(creep, structure);
                    }
                    else {
                        creep.memory.state = 'idle';
                    }
                }
            }
            else {
                creep.say("No Container");
                creep.drop(RESOURCE_ENERGY);
                creep.memory.state = 'idle';
            }
        }
    }
};
