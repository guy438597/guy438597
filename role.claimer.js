/*jshint esversion: 6, -W041, -W080, -W018 */
var costEfficientMove = require('command.costEfficientMove');
var findEnergy = require('command.findEnergy');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var findClosestEnergyStorage = require('command.findClosestEnergyStorage');

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        if (creep.memory.retreatRoom == undefined) {
            creep.memory.retreatRoom = Game.spawns.Spawn1.room.name;
        }

        var target;
        //old version:
        if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0) {
            costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.retreatRoom));
            creep.say("RETREAT");
        } else if (creep.room.name != creep.memory.claimRoomName) {
            //console.log("hi");
            creep.say("Claimer");
            costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.claimRoomName));
        } else {
            if (creep.memory.claimOption == "r") {
                if (creep.room.controller) {
                    creep.say("Rsv " + creep.memory.claimRoomName);
                    if (creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        costEfficientMove(creep, creep.room.controller);
                    }
                }
            } else {
                if (creep.memory.claimOption == "c") {
                    if (creep.room.controller) {
                        creep.say("Clm " + creep.memory.claimRoomName);
                        if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                            costEfficientMove(creep, creep.room.controller);
                        }
                    }
                }
            }
        }
    }
};
