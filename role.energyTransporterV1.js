/*jshint esversion: 6, -W041, -W080, -W018, -W083 */
var costEfficientMove = require('command.costEfficientMove');
var getDistance = require('command.getDistance');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var findClosestEnergyStorage = require('command.findClosestEnergyStorage');

module.exports = {
    /* The purpose of this role:
    Once hitting level 4 with the RoomController ->
    make 1-2 energy transporter for each container to transport to the storage
    */



    /*Priority list of worker guy:
    - He's gonna refill the spawn with energy, then refill extensions
    - then repair all structures except for towers and walls, if theyre below 50% hp
    - then build new stuff like roads, mines, new extensions etc
    - if then anything is remaining, he will go upgrade
    - only wall repairers are dedicated wall repairers (one guy) who will then become a refiller if idle
    */

    // a function to run the logic for this role
    run: function(creep) {
        //idea for this creep: move to mining container (dedicated container per transporter)
        //then move energy content to storage, so lvl 4 required!

        var withdrawingContainer;
        var target;
        var error;
        var targets, Distance, tempTarget, tempDistance;
        if ((creep.memory.state == 'working' || creep.memory.state == 'idle') && creep.carry.energy == 0) {
            // switch state
            creep.memory.state = 'pickUpEnergy';
        }
        // if creep is harvesting energy but is full
        else if ((creep.memory.state == 'pickUpEnergy' || creep.memory.state == 'idle') && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.state = 'working';
        }
        if (creep.ticksToLive < 50) {
            creep.memory.state = 'dying';
        }




        if (creep.memory.state == 'working') {
            if (creep.memory.delivery != undefined){
                target = Game.getObjectById(creep.memory.delivery);
            }

            if (target == undefined) {
                target = findClosestEnergyStorage(creep);
            }


            //targets = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_STORAGE && s.my || s.structureType == STRUCTURE_CONTAINER && Memory.structures.miningContainers.indexOf(s.id) == -1 && s.store[RESOURCE_ENERGY] < 2000});
            if (target != undefined) {
                //target = Game.getObjectById(target);
                //console.log(target.store[RESOURCE_ENERGY]);
                if (target.store[RESOURCE_ENERGY] >= 2000){
                    target = undefined;
                }
                else{
                    error = creep.transfer(target, RESOURCE_ENERGY);
                    if (error == ERR_NOT_IN_RANGE) {
                        // move towards the source
                        creep.memory.delivery = target.id;
                        creep.say("Enrgy Dlvr");
                        costEfficientMove(creep, target);
                    }

                }
            }
        } else if (creep.memory.state == "dying"){
            target = findClosestEnergyStorage(creep);
            if (creep.transfer(target) == ERR_NOT_IN_RANGE){
                costEfficientMove(creep, target);
            }
        }

        else {
            if (creep.memory.withdrawingContainer != undefined){
                withdrawingContainer = Game.getObjectById(creep.memory.withdrawingContainer);
            }
            if (withdrawingContainer != undefined && withdrawingContainer != null) {
                error = creep.withdraw(withdrawingContainer, RESOURCE_ENERGY);
                if (error == ERR_NOT_IN_RANGE) {
                    // move towards the source
                    creep.say("Enrgy Pickup");
                    costEfficientMove(creep, withdrawingContainer);
                }
            }
        }
    }
};
