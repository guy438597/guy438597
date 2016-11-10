/*jshint esversion: 6, -W041, -W080, -W018, -W069, -W083, -W004 */

// import modules
var costEfficientMove = require('command.costEfficientMove');
var cleanListOfDeadCreeps = require('command.cleanListOfDeadCreeps');
var cleanListOfDeadIDs = require('command.cleanListOfDeadIDs');
var getDistance = require('command.getDistance');
var findClosestEnergyStorage = require('command.findClosestEnergyStorage');
var findEnergy = require('command.findEnergy');
var moveOutOfTheWay = require('command.moveOutOfTheWay');
var chooseClosest = require('command.chooseClosest');

require('prototype.spawnV2')();
var roleHarvester = require('role.harvester');
var roleSourceMiner = require('role.sourceMiner');
var roleWallRepairer = require('role.wallRepairer');
var roleEnergyRefiller = require('role.energyRefiller');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleClaimer = require('role.claimer');
var roleEnergyTransporter = require('role.energyTransporter');
var roleRepairer = require('role.repairer');
var roleDefender = require('role.defender');
var roleScout = require('role.scout');

/*
function cleanListOfDeadCreeps(array) {
    // in case a creep is idle and blocking the way, use this function to make him move out of the way of friendly creeps
    for (let creep in array){
        console.log(array[creep]);
        if (Game.creeps[array[creep]] == undefined){
            let index = array.indexOf(Game.creeps[creep]);
            array.splice(index, 1);
            //return module.exports(array);
        }
    }
    return array;

}*/

module.exports.loop = function () {
    var totalTransporters = 0;
    var moreMinersRequired = false;

    for (let name in Memory.creeps) {
        if (Game.creeps[name] == undefined) {
            delete Memory.creeps[name];
        }
    }

    // sources i mine energy from
    if (Memory.energy == undefined){
        Memory.energy = {};
    }
    Memory.energy.energySources = [
        ["57ef9e7a86f108ae6e60f5c3", 3, 5, "E62S49"], //main Spawn1
        ["57ef9e7a86f108ae6e60f5c5", 4, 5, "E62S49"],
        //["57ef9e3586f108ae6e60ef7f", 2, 5, "E49N63"], //south of Spawn1
        //["57ef9e3586f108ae6e60ef81", 4, 5, "E49N63"],
        //4: ["57ef9e3286f108ae6e60ef3c", 4, 5, "E48N64"], //west of Spawn1
        //5: ["57ef9e3286f108ae6e60ef3a", 4, 5, "E48N64"]
    ];

    if (Memory.energy.totalTransportersRequired != undefined){
        var totalTransporters = Memory.energy.totalTransportersRequired;
    }

    var moreMinersRequired = false;
    for (let i in Memory.energy.energySources){
        cleanListOfDeadCreeps(Memory.energy.energySourceMiners[i]);
        var countBodyParts = 0;
        var maxBodyParts = Memory.energy.energySources[i][2];
        for (let name of Memory.energy.energySourceMiners[i]){
            let creep = Game.creeps[name];
            countBodyParts += creep.getActiveBodyparts(WORK);
        }
        if (countBodyParts <= maxBodyParts){
            moreMinersRequired = true;
            break;
        }
    }


    if (Memory.claims == undefined){
        Memory.claims = {};
    }
    Memory.claims.claimLocations = [
        //["E49N63", "r"], //south of Spawn1
        //1: ["E48N64", "r"], //west of Spawn1
    ];
    if (Memory.claims.claimClaimers == undefined){
        Memory.claims.claimClaimers = [];
    }
    if (Memory.claims.claimClaimers.length < Memory.claims.claimLocations.length){
        for (var i = 0; i < Memory.claims.claimLocations.length - Memory.claims.claimClaimers.length; i++){
            Memory.claims.claimClaimers.push([]);
        }
    }
    minimumNumberOfClaimers = Memory.claims.claimClaimers.length;
    // rooms i want to reserve or claim


    if (Memory.defenses == undefined){
        Memory.defenses = {};
    }
    // list of main rooms i own, these rooms automatically spawn upgraders
    Memory.defenses.roomWatchlist = [
        //["E49N64", "E49N64"], // spawn 1
        //["E49N63", "E49N64"], // south of spawn 1
    ];
    if (Memory.defenses.roomsUnderAttack == undefined){
        Memory.defenses.roomsUnderAttack = [];
    }



    var spawning = Game.spawns.Spawn1.spawning != null;
    var energy = Game.spawns.Spawn1.room.energyAvailable;
    var energyMax = Game.spawns.Spawn1.room.energyCapacityAvailable;


    var towers = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_TOWER});
    for (let tower of towers) {
        let attackTarget;
        let healTarget;
        let repairTarget;
        if (attackTarget == undefined){
            attackTarget = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        }
        if (healTarget == undefined){
            healTarget = tower.pos.findClosestByRange(FIND_MY_CREEPS);
        }
        if (repairTarget == undefined){
            repairTarget = tower.pos.findClosestByRange(FIND_MY_STRUCTURES,  {filter: (r) => r.pos.getRangeTo(tower.pos) <= 5 });
        }
        if (attackTarget != undefined) {
            tower.attack(attackTarget);
        }else if (healTarget != undefined) {
            tower.heal(healTarget);
        }else if (repairTarget != undefined) {
            tower.repair(repairTarget);
        }
    }

    var numberOfSourceMiners = _.sum(Game.creeps, (c) => c.memory.role == 'sourceMiner');
    var numberOfWorkers = _.sum(Game.creeps, (c) => c.memory.role == 'worker');
    var numberOfEnergyRefillers = _.sum(Game.creeps, (c) => c.memory.role == 'energyRefiller');
    var numberOfEnergyTransporters = _.sum(Game.creeps, (c) => c.memory.role == 'energyTransporter');
    var numberOfHarvesters = _.sum(Game.creeps, (c) => c.memory.role == 'harvester');
    var numberOfWallRepairers = _.sum(Game.creeps, (c) => c.memory.role == 'wallRepairer');
    var numberOfBuilders = _.sum(Game.creeps, (c) => c.memory.role == 'builder');
    var numberOfUpgraders = _.sum(Game.creeps, (c) => c.memory.role == 'upgrader');
    var numberOfRepairers = _.sum(Game.creeps, (c) => c.memory.role == 'repairer');
    var numberOfClaimers = _.sum(Game.creeps, (c) => c.memory.role == 'claimer');
    var numberOfDefenders = _.sum(Game.creeps, (c) => c.memory.role == 'defender');

    // all the roles take up about 4-10 cpu
    // bigger creeps = less cpu usage i guess
    var combinedTicksEnergyRefiller = 0;
    for (let name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
            if (numberOfSourceMiners >= 2 && numberOfEnergyRefillers >= 2 && numberOfEnergyTransporters >= 2){creep.suicide();}
            else {roleHarvester.run(creep);}
        }
        else if (creep.memory.role == 'sourceMiner') {roleSourceMiner.run(creep);} // uses 0.0005 cpu
        else if (creep.memory.role == 'wallRepairer') {roleWallRepairer.run(creep);}
        else if (creep.memory.role == 'energyRefiller') {
            roleEnergyRefiller.run(creep);
            combinedTicksEnergyRefiller += creep.ticksToLive;
        } // uses about 0.005 cpu combinedTicksEnergyRefiller += creep.ticksToLive;
        else if (creep.memory.role == 'energyTransporter') {roleEnergyTransporter.run(creep);} //uses about 0.002 cpu
        else if (creep.memory.role == 'builder') {roleBuilder.run(creep);} //uses about 0.001 cpu
        else if (creep.memory.role == 'repairer') {roleRepairer.run(creep);}
        else if (creep.memory.role == 'upgrader') {roleUpgrader.run(creep);} //uses about 0.0007 cpu
        else if (creep.memory.role == 'claimer') {roleClaimer.run(creep);}
        else if (creep.memory.role == 'defender') {roleDefender.run(creep);}
        else if (creep.memory.role == 'scout') {roleScout.run(creep);}
    }




    if (Memory.structures == undefined){Memory.structures = {};}
    if ((Game.time) % 20 == 0) {
        Memory.structures.repairTargets = [];
        Memory.structures.buildingSites = [];
        for (let room in Game.rooms) {
            // update repairsites
            // update targets that need repair (below 50% hp)
            var targets = Game.rooms[room].find(FIND_STRUCTURES);
            for (let target of targets){
                if ((target.structureType == STRUCTURE_ROAD || target.structureType == STRUCTURE_CONTAINER || target.my == true) && target.hits < target.hitsMax * 0.5){
                    if ((Memory.structures.repairTargets.indexOf(target.id) == -1)){
                        Memory.structures.repairTargets.push(target.id);
                    }
                }
            }
            // update construction sites
            // update buildingSites targets which are still in construction
            var targets = Game.rooms[room].find(FIND_MY_CONSTRUCTION_SITES);
            for (let target of targets){
                if ((Memory.structures.buildingSites.indexOf(target.id) == -1)){
                    Memory.structures.buildingSites.push(target.id);
                }
            }
        }
    }

    // if buildings and creeps are no longer existing but still in memory
    cleanListOfDeadIDs(Memory.structures.buildingSites);
    cleanListOfDeadIDs(Memory.structures.repairTargets);
    if (Memory.structures != undefined){
        if (Memory.structures.miningContainers != undefined) {
            cleanListOfDeadIDs(Memory.structures.miningContainers);
            // remove dead creeps from transporter list
            /*for (let i in Memory.energy.energySourceMiners){
                //console.log(Memory.energy.energySourceMiners);
                cleanListOfDeadCreeps(Memory.energy.energySourceMiners[i]);
            }*/
        }
        else{
            Memory.structures.miningContainers = [];
        }
    }

    // adjust number of builders and repairers according to how many buildingsites and repairtargets there are
    minimumNumberOfBuilders = Math.min(_.ceil(Memory.structures.buildingSites.length / 5), 5);
    minimumNumberOfRepairers = Math.min(_.ceil(Memory.structures.repairTargets.length/20), 3);
    minimumNumberOfUpgraders = 5;

    var name;
    if (numberOfHarvesters < 2 && (numberOfSourceMiners < 1 || numberOfEnergyRefillers < 1) && energy >= 200 && !spawning){
        name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'harvester');
        if (name != undefined && isNaN(name)){
            spawning = true;
            console.log(numberOfHarvesters + 1,"/","69", "Spawning emergency harvester!", name);
        }
    }

    //console.log(numberOfEnergyTransporters);
    //console.log(moreMinersRequired);
    if ((energy >= energyMax || energy >= 700) && !spawning || (numberOfEnergyRefillers < 2 && !spawning)){
        if (numberOfSourceMiners < Memory.energy.energySources.length || moreMinersRequired && numberOfEnergyRefillers >= 2) {
            //console.log("test", numberOfSourceMiners, Memory.energy.energySources.length);
            for (let i in Memory.energy.energySources){
                array = Memory.energy.energySources[i];
                sourceID = array[0];
                maxMiners = array[1];
                maxWorkBodyParts = array[2];
                roomName = array[3];
                if (Memory.energy.energySourceMiners != undefined){
                    if (Memory.energy.energySourceMiners[i] != undefined){
                        cleanListOfDeadCreeps(Memory.energy.energySourceMiners[i]);
                        var workerCount = 0;
                        if (Memory.energy.energySourceMiners != undefined){
                            workerCount = Memory.energy.energySourceMiners[i].length;
                        }
                        var tempBodyPartsCount = 0;
                        for (let i2 of Memory.energy.energySourceMiners[i]){
                            let creep = Game.creeps[i2];
                            tempBodyPartsCount += creep.getActiveBodyparts(WORK);
                            //console.log(creep);
                        }
                        //console.log(Memory.energy.energySourceMiners[i].length, maxMiners, tempBodyPartsCount, maxWorkBodyParts);
                        if (workerCount < maxMiners && tempBodyPartsCount < maxWorkBodyParts){
                            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'sourceMiner', sourceID, roomName);
                            if (name != undefined && isNaN(name)){
                                Memory.energy.energySourceMiners[i].push(name);
                                console.log(numberOfSourceMiners + 1,"/",Memory.energy.energySources.length, "Spawning new sourceMiner!", name);
                                break;
                            }
                        }
                    }
                    else {
                        Memory.energy.energySourceMiners.push([]);
                    }
                }
                else {
                    Memory.energy.energySourceMiners = [];
                }
            }
        }
        else if (((combinedTicksEnergyRefiller < 300 || numberOfEnergyRefillers < 2) && Memory.energy.energySources.length > 0) || numberOfEnergyRefillers < 2 && energy >= 300) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyRefiller');
            if (name != undefined && isNaN(name)){
                console.log(numberOfEnergyRefillers + 1,"/ 2", "Spawning new energyRefiller!", name);
            }

        }
        else if (numberOfEnergyTransporters < Memory.energy.energySources.length || numberOfEnergyTransporters < totalTransporters) {
            var totalTransporters = 0;
            for (let i in Memory.energy.energySources){
                array = Memory.energy.energySources[i];
                sourceID = array[0];
                if (Memory.energy.energySourceTransporters != undefined){
                    /**so a miner mines 10 energy per tick on average
                    a transporter with 10 carry bodyparts can carry 500 energy ->
                    need to maintain a distance of 50 TO the mining container, but on the way back the transporter is slowed down to 1/5th ?
                    so transporter constant should be around ((distance * 7) / 50);  (7 = 1 to the source, 6 per tick back)
                    1 carry part generates 1 fatigue if loaded, 1 move part decreases fatigue by 2 each tick
                    non loaded: 1 move distance per tick
                    loaded with 10 carry parts: move -> 10 fatigue -> 5 ticks to reduce -> wait 1 more tick -> move
                    so i need one transporter every around 10 distance?! at least
                    */
                    var distance = getDistance(Game.spawns.Spawn1, Game.getObjectById(sourceID));
                    var requiredTransporters = _.ceil(distance / 10);
                    totalTransporters += requiredTransporters;
                    if (Memory.energy.energySourceTransporters[i] != undefined){
                        cleanListOfDeadIDs(Memory.energy.energySourceTransporters[i]);
                        if (Memory.energy.energySourceTransporters[i].length < requiredTransporters) {
                            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyTransporter', sourceID);
                            Memory.energy.energySourceTransporters.push(name);
                        }
                    }
                    else{
                        Memory.energy.energySourceTransporters.push([]);
                    }
                }
                else{
                    Memory.energy.energySourceTransporters = [];
                }
            }
            if (name != undefined && isNaN(name)){
                console.log(numberOfEnergyTransporters + 1,"/", totalTransporters, "Spawning new energyTransporter!", name);
            }
            Memory.energy.totalTransportersRequired = totalTransporters;
        }
        else if (numberOfRepairers < minimumNumberOfRepairers && Memory.energy.energySources.length > 0) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'repairer');
            if (name != undefined && isNaN(name)){
                console.log(numberOfRepairers + 1,"/",minimumNumberOfRepairers, "Spawning new repairer!", name);
            }
        }
        else if (numberOfBuilders < minimumNumberOfBuilders && Memory.energy.energySources.length > 0) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'builder');
            if (name != undefined && isNaN(name)){
                console.log(numberOfBuilders + 1,"/",minimumNumberOfBuilders, "Spawning new builder!", name);
            }
        }
        else if (false && numberOfClaimers < 0 && Memory.energy.energySources.length > 0){//minimumNumberOfClaimers) {
            for (let i in claimLocations){

            }
        }
        else if (numberOfUpgraders < minimumNumberOfUpgraders && Memory.energy.energySources.length > 0 && Memory.structures.miningContainers.length > 0) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'upgrader');
            if (name != undefined && isNaN(name)){
                console.log(numberOfUpgraders + 1,"/",minimumNumberOfUpgraders, "Spawning new upgrader!", name);
            }
        }
    }


    //Memory.tempbuildList = undefined;
    Memory.tempbuildList = [];
    grid = [25, 18, 36, 10];
    if (Game.time % 500 == 0){
        //creates a grid from bottom left to top right
        for (let i = grid[0]; i < grid[2]; i+=2){
            for (let j = grid[1]; j > grid[3]; j-=2){
                Memory.tempbuildList.push([i, j, STRUCTURE_EXTENSION]);
                Memory.tempbuildList.push([i+1, j-1, STRUCTURE_EXTENSION]);
            }
        }
        //console.log("extensions to build:", Memory.tempbuildList);
        for (let i of Memory.tempbuildList){
            Game.spawns.Spawn1.room.createConstructionSite(i[0], i[1], i[2]);
        }
    }
};
