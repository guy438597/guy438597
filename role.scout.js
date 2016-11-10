/*jshint esversion: 6, -W041, -W080, -W018 */
var costEfficientMove = require('command.costEfficientMove');
var findEnergy = require('command.findEnergy');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var findClosestEnergyStorage = require('command.findClosestEnergyStorage');
var getDistance = require('command.getDistance');
var chooseClosest = require('command.chooseClosest');

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        var target;
        //old version:
        if (creep.memory.target != undefined){
            target = Game.getObjectById(creep.memory.target);
        }

        if (target != undefined){
            if (getDistance(creep, target) > 0){
                costEfficientMove(creep, target);
            }
        }
    }
};
