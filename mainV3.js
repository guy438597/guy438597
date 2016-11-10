/*jshint esversion: 6, -W041, -W080, -W018, -W069, -W083, -W004 */


// import modules
var costEfficientMove = require('command.costEfficientMove');
var cleanListOfDeadCreeps = require('command.cleanListOfDeadCreeps');
var cleanListOfDeadIDs = require('command.cleanListOfDeadIDs');
var getDistance = require('command.getDistance');
var findClosestEnergyStorage = require('command.findClosestEnergyStorage');

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
    for (let name in Memory.creeps) {
        if (Game.creeps[name] == undefined) {
            delete Memory.creeps[name];
        }
    }

    var transporterConstant = 20; // lower number will spawn more transporters

    // sources i mine energy from
    Memory.energy = {};
    Memory.energy.energySources = [
        ["57ef9e3586f108ae6e60ef7b", 4, 5, "E49N64"], //main Spawn1
        ["57ef9e3586f108ae6e60ef7d", 4, 5, "E49N64"],
        ["57ef9e3586f108ae6e60ef7f", 2, 5, "E49N63"], //south of Spawn1
        ["57ef9e3586f108ae6e60ef81", 4, 5, "E49N63"],
        //4: ["57ef9e3286f108ae6e60ef3c", 4, 5, "E48N64"], //west of Spawn1
        //5: ["57ef9e3286f108ae6e60ef3a", 4, 5, "E48N64"]
    ];

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
    if (Memory.claimClaimers.length < Memory.claims.claimLocations.length){
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
        ["E49N64", "E49N64"], // spawn 1
        ["E49N63", "E49N64"], // south of spawn 1
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


    for (let name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
            if (numberOfSourceMiners >= 2 && numberOfEnergyRefillers >= 2){creep.suicide();}
            else {roleHarvester.run(creep);}
        }
        else if (creep.memory.role == 'sourceMiner') {roleSourceMiner.run(creep);}
        else if (creep.memory.role == 'wallRepairer') {roleWallRepairer.run(creep);}
        else if (creep.memory.role == 'energyRefiller') {roleEnergyRefiller.run(creep);}
        else if (creep.memory.role == 'energyTransporter') {roleEnergyTransporter.run(creep);}
        else if (creep.memory.role == 'builder') {roleBuilder.run(creep);}
        else if (creep.memory.role == 'repairer') {roleRepairer.run(creep);}
        else if (creep.memory.role == 'upgrader') {roleUpgrader.run(creep);}
        else if (creep.memory.role == 'claimer') {roleClaimer.run(creep);}
        else if (creep.memory.role == 'defender') {roleDefender.run(creep);}
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
            for (let i in Memory.structures.miningContainersTransporters){
                cleanListOfDeadCreeps(Memory.structures.miningContainersTransporters[i]);
            }
        }
    }

    // adjust number of builders and repairers according to how many buildingsites and repairtargets there are
    minimumNumberOfBuilders = Math.min(_.ceil(Memory.buildingSites.length/5), 3);
    minimumNumberOfRepairers = Math.min(_.ceil(Memory.repairTargets.length/20), 3);

    var name;
    if (energy >= energyMax && !spawning){
        if (numberOfSourceMiners < 1 && numberOfEnergyRefillers < 1){
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'harvester');
            spawning = true;
            if (name != undefined && isNaN(name)){
                console.log(numberOfSourceMiners + 1,"/",minimumNumberOfSourceMiners, "Spawning new harvester!", name);
            }
        }
        else if (numberOfSourceMiners < Object.keys(Memory.energy.energySources).length) {
            for (let i in Memory.energy.energySources){
                array = Memory.energy.energySources[i];
                sourceID = array[0];
                maxMiners = array[1];
                maxWorkBodyParts = array[2];
                roomName = array[3];
                if (Memory.energy.energySourceMiners != undefined){
                    if (Memory.energy.energySourceMiners[i] != undefined){
                        var tempBodyPartsCount = 0;
                        for (let i2 of Memory.energy.energySourceMiners[i]){
                            tempBodyPartsCount += i2.getActiveBodyparts[WORK];
                        }
                        if (Memory.energy.energySourceMiners[i].length <= maxMiners && tempBodyPartsCount <= maxWorkBodyParts){
                            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'sourceMiner', sourceID, roomName);
                            if (name != undefined && isNaN(name)){
                                console.log(numberOfSourceMiners + 1,"/",minimumNumberOfSourceMiners, "Spawning new sourceMiner!", name);
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
        else if ((numberOfEnergyRefillers < 2).length) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyRefiller', sourceID, roomName);
            if (name != undefined && isNaN(name)){
                console.log(numberOfSourceMiners + 1,"/",minimumNumberOfSourceMiners, "Spawning new energyRefiller!", name);
            }

        }
        else if (numberOfEnergyTransporters < Memory.energy.energySources.length) {
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
                    if (Memory.energy.energySourceTransporters[i] != undefined && Memory.energy.energySourceTransporters < requiredTransporters){
                        name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyTransporter', sourceID);

                    }
                }
                else{
                    Memory.energy.energySourceTransporters = [];
                }
            }
            if (name != undefined && isNaN(name)){
                console.log(numberOfSourceMiners + 1,"/", Memory.energy.energySources.length, "Spawning new energyTransporter!", name);
            }
        }
        else if (numberOfRepairers < minimumNumberOfRepairers) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'repairer');
            if (name != undefined && isNaN(name)){
                console.log(numberOfRepairers + 1,"/",totalminimumNumberOfRepairersTransporters, "Spawning new repairer!", name);
            }
        }
        else if (numberOfBuilders < minimumNumberOfBuilders) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'builder');
            if (name != undefined && isNaN(name)){
                console.log(numberOfBuilders + 1,"/",minimumNumberOfBuilders, "Spawning new builder!", name);
            }
        }
        else if (numberOfClaimers < 0){//minimumNumberOfClaimers) {
            for (let i in claimLocations){

            }
        }
        else if (numberOfUpgraders < minimumNumberOfUpgraders) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'builder');
            if (name != undefined && isNaN(name)){
                console.log(numberOfUpgraders + 1,"/",minimumNumberOfUpgraders, "Spawning new builder!", name);
            }
        }
    }








    //console.log(Memory.test);
    //cleanListOfDeadCreeps(Memory.test);
    //cleanListOfDeadIDs(Memory.test);
    //console.log(Memory.test);

    // Set the minimum amount of workers i want to have
    var minimumNumberOfSourceMiners = 1;
    var minimumNumberOfEnergyRefillers = 2;
    var minimumNumberOfBuilders = 0;
    var minimumNumberOfRepairers = 0;
    var minimumNumberOfUpgraders = 3;
    var minimumNumberOfWallRepairers = 0;
    var minimumNumberOfClaimers = 0;

    // if spawning is true, this will block spawning



    var homeRoom = Game.spawns.Spawn1.room;

    // list of energy sources i want to mine from
    Memory.energySources = {
        0: ["57ef9e3586f108ae6e60ef7b", 4, 5, "E49N64"], //main Spawn1
        1: ["57ef9e3586f108ae6e60ef7d", 4, 5, "E49N64"],
        2: ["57ef9e3586f108ae6e60ef7f", 2, 5, "E49N63"], //south of Spawn1
        3: ["57ef9e3586f108ae6e60ef81", 4, 5, "E49N63"],
        //4: ["57ef9e3286f108ae6e60ef3c", 4, 5, "E48N64"], //west of Spawn1
        //5: ["57ef9e3286f108ae6e60ef3a", 4, 5, "E48N64"]
    };
    //test::

    // list of rooms i want to claim / reserve
    Memory.claimLocations = {
        0: ["E49N63", "r"], //south of Spawn1
        //1: ["E48N64", "r"], //west of Spawn1
    };

    if (Memory.defenses == undefined){
        Memory.defenses = {};
    }
    if (Memory.defenses.roomsUnderAttack == undefined){
        Memory.defenses.roomsUnderAttack = [];
    }

    // list of main rooms i own, these rooms automatically spawn upgraders
    Memory.defenses.roomWatchlist = {
        0: ["E49N64", "E49N64"], // spawn 1
        1: ["E49N63", "E49N64"], // south of spawn 1
    };

    if (Memory.defenses.roomDefenders == undefined){
        Memory.defenses.roomDefenders = [];
    }
    if ( Memory.defenses.attackers == undefined){
        Memory.defenses.attackers = [];
    }

    if (Memory.defenses.roomDefenders.length < Object.keys(Memory.defenses.roomWatchlist).length){
        for (var i = 0; i < Object.keys(Memory.defenses.roomWatchlist).length - Memory.defenses.roomDefenders.length; i++){
            Memory.defenses.roomDefenders.push([]);
        }
    }
    if (Memory.defenses.attackers.length < Object.keys(Memory.defenses.roomWatchlist).length){
        for (var i = 0; i < Object.keys(Memory.defenses.roomWatchlist).length - Memory.defenses.attackers.length; i++){
            Memory.defenses.attackers.push([]);
        }
    }

    // create empty array of list of claimers for claimlocations
    if (Memory.claimClaimers == undefined){
        Memory.claimClaimers = [];
    }
    if (Memory.claimClaimers.length < Object.keys(Memory.claimLocations).length){
        for (var i = 0; i < Object.keys(Memory.claimLocations).length - Memory.claimClaimers.length; i++){
            Memory.claimClaimers.push([]);
        }
    }

    if (Memory.structures.miningContainersTransporters == undefined){
        Memory.structures.miningContainersTransporters = [];
    }
    if (Memory.structures.miningContainersTransporters.length < Memory.structures.miningContainers.length){
        for (let i = 0; Memory.structures.miningContainers.length - Memory.structures.miningContainersTransporters.length; i++){
            Memory.structures.miningContainersTransporters.push([]);
        }
    }

    minimumNumberOfClaimers = Memory.claimClaimers.length;
    minimumNumberOfDefenders = Memory.claimLocations.length;

    //for (let name in Game.rooms){console.log(Game.rooms[name]);}
    //Game.getObjectById("581ee2e79eb6531a0d510457").my;
    //Game.spawns.Spawn1.pos.findInRange(FIND_STRUCTURES, 500) //find roads using this command

    // update main energy storages
    if ((Game.time) % 20 == 0) {
        Memory.repairTargets = [];
        //Memory.mainEnergyStorage = [];
        Memory.buildingSites = [];
        for (let room in Game.rooms) {
            // update repairsites
            // update targets that need repair (below 50% hp)
            var targets = Game.rooms[room].find(FIND_STRUCTURES);
            for (let target of targets){
                if (target.hits < target.hitsMax*0.5)
                {
                    //console.log(target, target.hits, target.hitsMax*0.5);
                }
                if ((target.structureType == STRUCTURE_ROAD || target.structureType == STRUCTURE_CONTAINER || target.my == true) && target.hits < target.hitsMax * 0.5){
                    //console.log(Memory.repairTargets);
                    if ((Memory.repairTargets.indexOf(target.id) == -1)){
                        Memory.repairTargets.push(target.id);
                    }
                }
            }


            // update construction sites
            // update buildingSites targets which are still in construction
            var targets = Game.rooms[room].find(FIND_MY_CONSTRUCTION_SITES);
            for (let target of targets){
                if ((Memory.buildingSites.indexOf(target.id) == -1)){
                    Memory.buildingSites.push(target.id);
                }
            }
        }
        //console.log("RepairTargets updated!", "BuildingSites updated!");
    }

    // check for memory entries of died creeps by iterating over Memory.creeps


    // adjust number of builders and repairers according to how many buildingsites and repairtargets there are
    minimumNumberOfBuilders = Math.min(_.ceil(Memory.buildingSites.length/10), 3);
    //console.log(Memory.buildingSites.length);
    minimumNumberOfRepairers = Math.min(_.ceil(Memory.repairTargets.length/20), 3);
    if (Memory.structures != undefined){
        if (Memory.structures.miningContainers != undefined) {
            //minimumNumberOfEnergyTransporters = Memory.energyTransporterLimit * Memory.structures.miningContainers.length;
            //console.log(Memory.structures.miningContainers);
            Memory.structures.miningContainers = cleanListOfDeadIDs(Memory.structures.miningContainers);
            //console.log(Memory.structures.miningContainers);/*
            /*for (let container in Memory.structures.miningContainers){
                if (Game.getObjectById(Memory.structures.miningContainers[container]) == null){
                    //console.log(container);
                    let index = Memory.structures.miningContainers.indexOf(container);
                    Memory.structures.miningContainers.splice(index, 1);

                }
            }*/
            // add more lists if list isnt long enough
            // remove dead creeps from transporter list
            for (let i in Memory.structures.miningContainersTransporters){
                Memory.structures.miningContainersTransporters[i] = cleanListOfDeadCreeps(Memory.structures.miningContainersTransporters[i]);
                /*for (let transporter in Memory.structures.miningContainersTransporters[i]){
                    if (Game.creeps[transporter] == undefined){
                        let index = Memory.structures.miningContainersTransporters[i].indexOf(transporter);
                        Memory.structures.miningContainersTransporters[i].splice(index, 1);
                    }
                }*/
            }
        }
    }

    // count
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
    var roleNumberDictionary = {
        'sourceMiner': numberOfSourceMiners,
        'energyRefiller': numberOfEnergyRefillers,
        'energyTransporter': numberOfEnergyTransporters,
        'builder': numberOfBuilders,
        'repairer': numberOfRepairers,
        'upgrader': numberOfUpgraders,
        'claimer': numberOfClaimers
    };
    var roleMinNumberDictionary = {
        'sourceMiner': minimumNumberOfSourceMiners,
        'energyRefiller': minimumNumberOfEnergyRefillers,
        'builder': minimumNumberOfBuilders,
        'repairer': minimumNumberOfRepairers,
        'upgrader': minimumNumberOfUpgraders,
        'claimer': minimumNumberOfClaimers
    };

    // run role scripts
    for (let name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
            if (numberOfSourceMiners >= 2 && numberOfEnergyRefillers >= 2){
                creep.suicide();
            }
            else {
                roleHarvester.run(creep);
            }
        }
        else if (creep.memory.role == 'sourceMiner') {roleSourceMiner.run(creep);}
        else if (creep.memory.role == 'wallRepairer') {roleWallRepairer.run(creep);}
        else if (creep.memory.role == 'energyRefiller') {roleEnergyRefiller.run(creep);}
        else if (creep.memory.role == 'energyTransporter') {roleEnergyTransporter.run(creep);}
        else if (creep.memory.role == 'builder') {roleBuilder.run(creep);}
        else if (creep.memory.role == 'repairer') {roleRepairer.run(creep);}
        else if (creep.memory.role == 'upgrader') {roleUpgrader.run(creep);}
        else if (creep.memory.role == 'claimer') {roleClaimer.run(creep);}
        else if (creep.memory.role == 'defender') {roleDefender.run(creep);}
        else {
            //costEfficientMove(creep, new RoomPosition(22, 37, creep.pos.roomName));
            //creep.suicide();
        }
    }

    var energy = Game.spawns.Spawn1.room.energyAvailable;
    var energyMax = Game.spawns.Spawn1.room.energyCapacityAvailable;
    var name = undefined;

    var spawnMinRequirements = true; // if we have miners and transporters and containers
    if (energy < energyMax) {spawnMinRequirements = false;}
    //console.log(!spawning, energy, energyMax);
    if (Memory.structures != undefined && Memory.energySourceMiners != undefined && Memory.structures.miningContainers != undefined && Memory.structures.miningContainersTransporters != undefined){
        for (let i in Memory.energySources){
            if (Memory.structures.miningContainers[i] != undefined && Memory.structures.miningContainers[i].length >= 4 &&  Memory.structures.miningContainers[i][3] == homeRoom && Memory.energySourceMiners[i] < 1){
                console.log(Memory.structures.miningContainers[i][3]);
                spawnMinRequirements = false;
            }
        }
        for (let i in Memory.structures.miningContainers) {
            if (Memory.structures.miningContainersTransporters[i] < 1 ){
                console.log(Memory.structures.miningContainersTransporters[i]);
                spawnMinRequirements = false;
            }
        }
    }
    //console.log(spawnMinRequirements);

    // if attackers are found, respond by spawning defensive soldiers to defend rooms, make them go back to spawning room if wounded
    // spawn defenders if invasion is spotted somewhere
    if (energy >= energyMax && spawnMinRequirements){
        for (let i in Memory.defenses.roomWatchlist){
            let room = Game.rooms[Memory.defenses.roomWatchlist[i][0]];
            let retreatRoom = Game.rooms[Memory.defenses.roomWatchlist[i][1]];
            if (room != undefined){
                let attackers = room.find(FIND_HOSTILE_CREEPS);
                let defenders = room.find(FIND_MY_CREEPS);
                if (attackers.length > 0){
                    console.log(attackers);
                    var enemyAttackParts = 0;
                    var enemyMoveParts = 0;
                    var enemyTotalParts = 0;
                    var friendlyAttackParts = 0;
                    var friendlyMoveParts = 0;
                    var friendlyTotalParts = 0;
                    for (let attacker of attackers){
                        enemyTotalParts += _.ceil(attacker.hits / 100);
                        enemyAttackParts += attacker.getActiveBodyparts(ATTACK);
                        enemyAttackParts += attacker.getActiveBodyparts(RANGED_ATTACK);
                        enemyMoveParts += attacker.getActiveBodyparts(MOVE);
                    }
                    if (defenders.length > 0){
                        for (let defender of defenders){
                            friendlyTotalParts += _.ceil(defender.hits / 100);
                            friendlyAttackParts += defender.getActiveBodyparts(ATTACK);
                            friendlyAttackParts += defender.getActiveBodyparts(RANGED_ATTACK);
                            friendlyMoveParts += defender.getActiveBodyparts(MOVE);
                        }
                    }
                    enemyToughParts = enemyTotalParts - enemyAttackParts - enemyMoveParts;
                    friendlyToughParts = friendlyTotalParts- friendlyAttackParts - friendlyMoveParts;
                    Memory.defenses.attackers[i] = [room, enemyToughParts, enemyAttackParts, enemyMoveParts, friendlyToughParts, friendlyAttackParts, friendlyMoveParts];
                    if (energy >= energyMax && (friendlyTotalParts < enemyTotalParts || friendlyAttackParts < enemyAttackParts || friendlyMoveParts < enemyMoveParts)) {
                        name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'defender', enemyToughParts, enemyMoveParts, enemyAttackParts, room, retreatRoom);
                        console.log("Spawning new defender for room", room);
                        spawning = true;
                        break;
                    }
                }
                else {
                    delete Memory.defenses.attackers[i];
                    Memory.defenses.attackers[i] = undefined;
                    if (Memory.defenses.roomsUnderAttack.indexOf(Memory.defenses.roomWatchlist[i][0]) != -1) {
                        let index = Memory.defenses.roomsUnderAttack.indexOf(Memory.defenses.roomWatchlist[i][0]);
                        Memory.defenses.roomsUnderAttack.splice(index, 1);
                    }

                }
            }
            else{
                if (Memory.defenses.attackers[i] != undefined){
                    if (Memory.defenses.attackers[i][1] > Memory.defenses.attackers[i][4] || Memory.defenses.attackers[i][2] > Memory.defenses.attackers[i][5] || Memory.defenses.attackers[i][3] > Memory.defenses.attackers[i][6]){
                        if (room != undefined){
                            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'defender', Memory.defenses.attackers[i][1], Memory.defenses.attackers[i][2], Memory.defenses.attackers[i][3], room, retreatRoom);
                            console.log("Spawning new defender for room", room);
                            spawning = true;
                            break;
                        }
                    }
                }
            }
        }
    }


    // tower script, pew pew and stuffs
    var towers = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType == STRUCTURE_TOWER
    });
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
    //console.log(Game.cpu.getUsed());

    // count the number of creeps alive for each role
    // _.sum will count the number of properties in Game.creeps filtered by the
    //  arrow function, which checks for the creep being a harvester

    // count room energy calculation

    //2D array that hold the workers of each energy source
    if (Memory.energySourceMiners == undefined){
        Memory.energySourceMiners = [];
        console.log("Memory.energySourceMiners created!");
        for (var source in Memory.energySources){
            Memory.energySourceMiners.push([]);
        }
    }



    // spawn new sourceMiner if requirements met
    if ((energy >= energyMax) && numberOfEnergyRefillers > 0){
        if (Object.keys(Memory.energySources).length > Memory.energySourceMiners.length){
            for (var i = 0; i < Object.keys(Memory.energySources).length - Memory.energySourceMiners.length; i++){
                Memory.energySourceMiners.push([]);
            }
            console.log("Memory.energySourceMiners length adjusted! Now length", Memory.energySourceMiners.length);
        }
        for (let source in Memory.energySources){
            let sourceID = Memory.energySources[source][0];
            let sourceObject = Game.getObjectById(sourceID);
            let sourceWorkerLimit = Memory.energySources[source][1];
            let sourceWorkPartLimit = Memory.energySources[source][2];
            let sourceRoomName = Memory.energySources[source][3];

            let workersCount = 0;
            let workPartsCount = 0;
            let ticksRemaining = 0;
            Memory.energySourceMiners[source] = cleanListOfDeadCreeps(Memory.energySourceMiners[source]);
            /*for (let miner of Memory.energySourceMiners[source]){
                var creep = Game.creeps[miner];
                //console.log(creep.ticksToLive);
                if (creep == undefined){
                    console.log("Removing dead miner:", miner);
                    let index = Memory.energySourceMiners[source].indexOf(miner);
                    Memory.energySourceMiners[source].splice(index, 1);
                    continue;

                }
            }*/
            for (let miner of Memory.energySourceMiners[source]){
                var creep = Game.creeps[miner];
                workersCount += 1;
                workPartsCount += creep.getActiveBodyparts(WORK);
                ticksRemaining += creep.ticksToLive;
            }
            if (workersCount < sourceWorkerLimit && workPartsCount < sourceWorkPartLimit && ticksRemaining <= 50 && !spawning){
                if (Memory.defenses.roomsUnderAttack.indexOf(sourceRoomName) == -1){
                    name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'sourceMiner', sourceID, sourceRoomName);
                    spawning = true;
                    Memory.energySourceMiners[source].push(name);
                    console.log("Spawning new sourceMiner to mine at source", sourceID, name);
                    break;
                }
            }
        }
    }

    //console.log(numberOfRepairers, minimumNumberOfRepairers);
    //spawn new claimer if requirements met
    if (energy >= energyMax && !spawning && spawnMinRequirements && numberOfBuilders >= 1 && numberOfRepairers >= 1 && numberOfEnergyRefillers >= minimumNumberOfEnergyRefillers) {
        for (let i in Memory.claimLocations){
            var ticksRemaining = 0;
            if (Memory.claimClaimers[i].length > 0){
                //console.log(Memory.claimClaimers[i]);
                Memory.claimClaimers[i] = cleanListOfDeadCreeps(Memory.claimClaimers[i]);/*
                for (let claimer of Memory.claimClaimers[i]){
                    let creep = Game.creeps[claimer];
                    if (creep == undefined){
                        let index = Memory.claimClaimers[i].indexOf(claimer);
                        console.log("Removing dead claimer:", claimer, Memory.claimClaimers[i], index);
                        Memory.claimClaimers[i].splice(index, 1);
                        continue;
                    }*/
                for (let claimer of Memory.claimClaimers[i]){
                    let creep = Game.creeps[claimer];
                    ticksRemaining += creep.ticksToLive;
                }
                if (ticksRemaining >= 100){
                    continue;
                }
            }
            if (Memory.defenses.roomsUnderAttack.indexOf(Memory.claimLocations[i][0]) == -1 && !spawning){
                name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'claimer', Memory.claimLocations[i][0], Memory.claimLocations[i][1]);
                if (name != undefined && isNaN(name)){
                    spawning = true;
                    console.log(numberOfClaimers + 1, "Spawning new claimer!", name, Memory.claimLocations[i][0], Memory.claimLocations[i][1]);
                    Memory.claimClaimers[i].push(name);
                    break;
                }
            }
        }
    }
    //console.log(numberOfRepairers);
    // spawning section, spawn the rest of the creeps
    if ((numberOfSourceMiners == 0 || numberOfEnergyRefillers == 0) && numberOfHarvesters == 0 && energy >= 200 && spawning == false) {
        // spawn one with what is available
        name = Game.spawns.Spawn1.createCustomCreepV2(
            Game.spawns.Spawn1.room.energyAvailable, 'harvester');
        spawning = true;
        console.log("Spawning an emergency harvester!");
    }
    else if ((energy >= energyMax || energy >= 150 && (numberOfEnergyRefillers == 0 ||numberOfSourceMiners == 0 && spawnMinRequirements))){

        if (numberOfSourceMiners < minimumNumberOfSourceMiners && numberOfEnergyRefillers > 0 && spawning == false) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'sourceMiner', Memory.energySources[0][0]);
            spawning = true;
            if (name != undefined && isNaN(name)){
                Memory.energySourceMiners[0].push(name);
            }
            console.log(numberOfSourceMiners + 1,"/",minimumNumberOfSourceMiners, "Spawning new energy source miner!");
        }
        if (numberOfEnergyRefillers < minimumNumberOfEnergyRefillers && !spawning) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyRefiller');
            spawning = true;
            console.log(numberOfEnergyRefillers + 1,"/", minimumNumberOfEnergyRefillers, "Spawning new energy refiller!");
        }
        else if (!spawning) {
            var minimumNumberOfEnergyTransporters = 0;
            for (let i in Memory.structures.miningContainers){
                miningContainer = Game.getObjectById(Memory.structures.miningContainers[i]);
                var requiredTransporters = _.ceil(getDistance(miningContainer, findClosestEnergyStorage(miningContainer)) / transporterConstant);
                //console.log(requiredTransporters);
                minimumNumberOfEnergyTransporters += requiredTransporters;
                cleanListOfDeadCreeps(Memory.structures.miningContainersTransporters[i]);
                if (Memory.structures.miningContainersTransporters[i].length < requiredTransporters && spawning == false && Memory.defenses.roomsUnderAttack.indexOf(miningContainer.room.name) == -1) {
                    name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyTransporter', Memory.structures.miningContainers[i]);
                    Memory.structures.miningContainersTransporters[i].push(name);
                    spawning = true;
                }
            }
            if (isNaN(name) && name != undefined){
                console.log(numberOfEnergyTransporters + 1, "/",minimumNumberOfEnergyTransporters, "Spawning new energy transporter!");
            }
            //name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyTransporter');
            //console.log(numberOfEnergyTransporters + 1, "/",minimumNumberOfEnergyTransporters,"Spawning new energy transporter!");
        }

        if (numberOfBuilders < minimumNumberOfBuilders && spawnMinRequirements && !spawning) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'builder');
            spawning = true;
            console.log(numberOfBuilders + 1, "/",minimumNumberOfBuilders,"Spawning new builder!");
        }
        else if (numberOfRepairers < minimumNumberOfRepairers && spawnMinRequirements && !spawning) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'repairer');
            spawning = true;
            console.log(numberOfRepairers + 1,"/", minimumNumberOfRepairers, "Spawning new repairer!");
        }
        else if (numberOfUpgraders < minimumNumberOfUpgraders && spawnMinRequirements && !spawning) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'upgrader');
            spawning = true;
            console.log(numberOfUpgraders + 1,"/", minimumNumberOfUpgraders, "Spawning new upgrader!");
        }
        else if (numberOfWallRepairers < minimumNumberOfWallRepairers && spawnMinRequirements && !spawning) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'wallRepairer');
            spawning = true;
            console.log(numberOfWallRepairers + 1,"/",minimumNumberOfWallRepairers, "Spawning new wall repairer!");
        }
        else {
            //name = Game.spawns.Spawn1.createCustomCreep(energy, 'builder');
        }
    }


    //var error2 = Game.spawns.Spawn1.room.createConstructionSite(25, 12, STRUCTURE_STORAGE);

    // print name to console if spawning was a success
    // name > 0 would not work since string > 0 returns false
    if (spawning == true && isNaN(name) && name != undefined) {
        //console.log("Spawned new creep: " + name);
    }
};
