/*jshint esversion: 6, -W041, -W080, -W018, -W004 */
var costEfficientMove = require('command.costEfficientMove');
var findEnergy = require('command.findEnergy');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var findClosestEnergyStorage = require('command.findClosestEnergyStorage');

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
        //console.log(creep.spawning, creep.timeToLive);

        // if creep is bringing energy to a structure but has no energy left
        if ((creep.memory.state == 'working' || creep.memory.state == 'idle') && creep.carry.energy == 0) {
            // switch state
            creep.memory.state = 'pickUpEnergy';
            creep.memory.pickUpEnergyTarget = undefined;
        }
        // if creep is harvesting energy but is full
        else if ((creep.memory.state == 'pickUpEnergy' || creep.memory.state == 'idle') && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.state = 'working';
            creep.memory.structure = undefined;
        }

        // if creep is supposed to transfer energy to a structure
        if (creep.memory.state == 'working') {
            // find closest spawn, extension or tower which is not full
            var structure;
            if (creep.memory.structure != undefined){
                structure = Game.getObjectById(creep.memory.structure);
            }
            if (structure == undefined) {
                structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    // the second argument for findClosestByPath is an object which takes
                    // a property called filter which can be a function
                    // we use the arrow operator to define it
                    filter: (s) => (s.structureType == STRUCTURE_EXTENSION) &&
                    s.energy < s.energyCapacity
                });
            }
            if (structure == undefined){
                structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    // the second argument for findClosestByPath is an object which takes
                    // a property called filter which can be a function
                    // we use the arrow operator to define it
                    filter: (s) => (s.structureType == STRUCTURE_SPAWN) &&
                        s.energy < s.energyCapacity
                });
            }
            if (structure == undefined) {
                structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    // the second argument for findClosestByPath is an object which takes
                    // a property called filter which can be a function
                    // we use the arrow operator to define it
                    filter: (s) => (s.structureType == STRUCTURE_TOWER) &&
                        s.energy < s.energyCapacity
                });
            }

            // if we found one
            if (structure != undefined) {
                // try to transfer energy, if it is not in range
                if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.say("g " +structure.structureType);
                    //creep.say("Trnsfr Enrgy");
                    costEfficientMove(creep, structure);
                    creep.memory.structure = structure;
                }
            }
        }
        else if (creep.memory.state == "dying"){
            target = findClosestEnergyStorage(creep);
            if (creep.transfer(target) == ERR_NOT_IN_RANGE){
                costEfficientMove(creep, target);
            }
        }
        // if creep is supposed to harvest energy from source

        else {
            var target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {filter: (s) => s.amount >= 50 && s.pos.getRangeTo(creep.pos) < 10});
            // try to harvest energy, if the source is not in range
            if (target != undefined && target != null) {
                if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
                    // move towards the source
                    creep.say(target.amount, "pick up");
                    costEfficientMove(creep, target);
                }
                else{
                    creep.memory.state = 'working';
                }
            }
            else{
                target = undefined;
                if (creep.memory.pickUpEnergyTarget == undefined || creep.memory.pickUpEnergyTarget == null){
                    target = findEnergy(creep, Math.min(50, creep.carryCapacity));
                    //console.log(target);
                }
                else {
                    target = Game.getObjectById(creep.memory.pickUpEnergyTarget);
                    if (target.store[RESOURCE_ENERGY] < creep.carryCapacity){
                        creep.memory.pickUpEnergyTarget = undefined;
                        target = undefined;
                    }
                }
                if (target != undefined) {
                    if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        // move towards the source
                        creep.memory.pickUpEnergyTarget = target.id;
                        creep.say("Energy Withdraw");
                        costEfficientMove(creep, target);
                    }
                }
            }
        }
    }
};
