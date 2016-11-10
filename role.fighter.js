/*jshint esversion: 6, -W041, -W080, -W018 */
var costEfficientMove = require('command.costEfficientMove');
var findEnergy = require('command.findEnergy');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var findClosestEnergyStorage = require('command.findClosestEnergyStorage');

var costEfficientMove = require('command.costEfficientMove');
module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        var target;
        var room = creep.memory.roomToDefend;
        var retreatRoom = creep.memory.retreatRoom;
        if (creep.memory.roomToDefend == undefined || creep.memory.roomToDefend == "0"){
            roomName = Memory.offense.attackRoom;
        }
        //console.log(typeof creep.memory.roomToDefend);
        //console.log(room);
        //old version:


        if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0 && (creep.room.controller.safeMode == undefined || creep.room.controller.my)){
            creep.say("attack");
            target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            //console.log(target);
            if (target == undefined){
                target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
                if (target == undefined){
                    target = creep.pos.findClosestByPath(FIND_HOSTILE_CONSTRUCTION_SITES);
                }
            }
            if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                costEfficientMove(creep, target);
            }
        }
        else if (creep.room.name != roomName && creep.hits >= creep.hitsMax * 0.5) {
            creep.say("Defend!");
            //console.log(creep.pos);
            costEfficientMove(creep, new RoomPosition(25, 25, roomName));
        } else {
            if (creep.hits < creep.hitsMax) {
                if (creep.room != retreatRoom) {
                    //console.log(creep.room.name, room.name);
                    creep.say("Retreat!");
                    costEfficientMove(creep, new RoomPosition(25, 25, retreatRoom));
                } else {
                    target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        fitler: (s) => s.structureType = STRUCTURE_TOWER
                    });
                    costEfficientMove(creep, target.pos);
                }
            }
        }
    }
};
