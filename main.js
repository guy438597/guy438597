/*jshint esversion: 6, -W041, -W080, -W018, -W069, -W083, -W004 */

// import modules
require('prototype.spawn')();

var chooseClosest = require('command.chooseClosest');
var cleanListOfDeadCreeps = require('command.cleanListOfDeadCreeps');
var cleanListOfDeadIDs = require('command.cleanListOfDeadIDs');
var costEfficientMove = require('command.costEfficientMove');
var findClosestEnergyStorage = require('command.findClosestEnergyStorage');
var findEnergy = require('command.findEnergy');
var getDistance = require('command.getDistance');
var getDistanceInTicks = require('command.getDistanceInTicks');
var moveOutOfTheWay = require('command.moveOutOfTheWay');

var roleBuilder = require('role.builder');
var roleClaimer = require('role.claimer');
var roleFighter = require('role.fighter');
var roleEnergyRefiller = require('role.energyRefiller');
var roleEnergyTransporter = require('role.energyTransporter');
var roleHarvester = require('role.harvester');
var roleRepairer = require('role.repairer');
var roleScout = require('role.scout');
var roleSourceMiner = require('role.sourceMiner');
var roleUpgrader = require('role.upgrader');
var roleWallRepairer = require('role.wallRepairer');

module.exports.loop = function() {
    if (Memory.offense == undefined) {
        Memory.offense = {};
    }

    //some settings that can be changed quickly
    var makeAttackUnitsHighPriority = false; //spawn an army? have higher priority than repairer-spawn
    var makeAttackUnitsLowPriority = true; //for constant attack
    Memory.offense.attackRoom = "E62S47"; //where should the army go to? army will be on a-move

    var energyTransporterConstant = 15;
    var minimumNumberOfUpgraders = 3; //spawn more if you bank up energy in containers


    if (Memory.claims == undefined) {
        Memory.claims = {};
    }
    // rooms i want to reserve or claim
    Memory.claims.claimLocations = [
        ["E61S49", "r"], //west of Spawn1
        //["E62S48", "r"], //north of Spawn1
    ];

    // sources i mine energy from
    if (Memory.energy == undefined) {
        Memory.energy = {};
    }
    Memory.energy.energySources = [
        ["57ef9e7a86f108ae6e60f5c3", 3, 5, "E62S49"], //main Spawn1
        ["57ef9e7a86f108ae6e60f5c5", 4, 5, "E62S49"],
        ["57ef9e6786f108ae6e60f3f9", 2, 5, "E61S49"], //west of Spawn1
        ["57ef9e6786f108ae6e60f3fb", 1, 5, "E61S49"],
        //["57ef9e7a86f108ae6e60f5c0", 2, 5, "E62S48"], //north of Spawn1
    ];

    // adjust number of builders and repairers according to how many buildingsites and repairtargets there are
    minimumNumberOfBuilders = Math.min(_.ceil(Memory.structures.buildingSites.length / 5), 3);
    minimumNumberOfRepairers = Math.min(_.ceil(Memory.structures.repairTargets.length / 10), 3);

    var moreMinersRequired = false;
    for (let i in Memory.energy.energySources) {
        if (Memory.energy.energySourceMiners[i] != undefined) {
            cleanListOfDeadCreeps(Memory.energy.energySourceMiners[i]);
            var countBodyParts = 0;
            var maxMiners = Memory.energy.energySources[i][1];
            var maxBodyParts = Memory.energy.energySources[i][2];
            for (let name of Memory.energy.energySourceMiners[i]) {
                let creep = Game.creeps[name];
                countBodyParts += creep.getActiveBodyparts(WORK);
            }
            if (countBodyParts <= maxBodyParts && Memory.energy.energySourceMiners[i].length < maxMiners) {
                moreMinersRequired = true;
                break;
            }
        } else {
            Memory.energy.energySourceMiners.push([]);
        }
    }


    if (Memory.claims.claimClaimers == undefined) {
        Memory.claims.claimClaimers = [];
    }
    if (Memory.claims.claimClaimers.length < Memory.claims.claimLocations.length) {
        for (var i = 0; i < Memory.claims.claimLocations.length - Memory.claims.claimClaimers.length; i++) {
            Memory.claims.claimClaimers.push([]);
        }
    }


    var newClaimerRequired = false;
    for (let i in Memory.claims.claimLocations) {
        var loc = Memory.claims.claimLocations[i];
        var roomName2 = loc[0];
        //console.log(Game.rooms[roomName2].controller.reservation.username, Game.rooms[roomName2].controller.reservation.ticksToEnd);
        if (Game.rooms[roomName2] != undefined) {
            if (Game.rooms[roomName2].controller.my != undefined) {
                if (Game.rooms[roomName2].controller.reservation == undefined || Game.rooms[roomName2].controller.reservation.username == "Burny" && Game.rooms[roomName2].controller.reservation.ticksToEnd < 200) {
                    newClaimerRequired = true;
                }
            }
        } else {
            newClaimerRequired = true;
        }
    }


    if (Memory.defenses == undefined) {
        Memory.defenses = {};
    }
    // list of main rooms i own, these rooms automatically spawn upgraders
    Memory.defenses.roomWatchlist = [
        //["E49N64", "E49N64"], // spawn 1
        //["E49N63", "E49N64"], // south of spawn 1
    ];
    if (Memory.defenses.roomsUnderAttack == undefined) {
        Memory.defenses.roomsUnderAttack = [];
    }


    var spawning = Game.spawns.Spawn1.spawning != null;
    var energy = Game.spawns.Spawn1.room.energyAvailable;
    var energyMax = Game.spawns.Spawn1.room.energyCapacityAvailable;
    var minimumNumberOfEnergyRefillers = _.ceil(energyMax / 300);


    var towers = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType == STRUCTURE_TOWER
    });
    for (let tower of towers) {
        let attackTarget;
        let healTarget;
        let repairTarget;
        if (attackTarget == undefined) {
            attackTarget = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {filter: (s) => s.getActiveBodyparts(HEAL) > 0});
        } if (attackTarget == undefined) {
            attackTarget = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        }
        if (healTarget == undefined) {
            healTarget = tower.pos.findClosestByRange(FIND_MY_CREEPS);
        }
        if (repairTarget == undefined) {
            repairTarget = tower.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (r) => r.hits < r.hitsMax * 0.75
            });
        }
        if (attackTarget != undefined) {
            tower.attack(attackTarget);
        } else if (healTarget != undefined) {
            tower.heal(healTarget);
        } else if (repairTarget != undefined) {
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
    var numberOfFighters = _.sum(Game.creeps, (c) => c.memory.role == 'fighter');

    for (let name in Memory.creeps) {
        if (Game.creeps[name] == undefined) {
            delete Memory.creeps[name];
        }
    }

    var j1 = Game.cpu.getUsed();

    // all the roles take up about 4-10 cpu
    // bigger creeps = less cpu usage i guess
    var combinedTicksEnergyRefiller = 0;
    for (let name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
            if (numberOfSourceMiners >= 2 && numberOfEnergyRefillers >= 2 && numberOfEnergyTransporters >= 2) {
                creep.suicide();
            } else {
                roleHarvester.run(creep);
            }
        } else if (creep.memory.role == 'sourceMiner') {
            roleSourceMiner.run(creep);
        } // uses 0.0005 cpu
        else if (creep.memory.role == 'wallRepairer') {
            roleWallRepairer.run(creep);
        } else if (creep.memory.role == 'energyRefiller') {
            roleEnergyRefiller.run(creep);
            combinedTicksEnergyRefiller += creep.ticksToLive;
        } // uses about 0.005 cpu combinedTicksEnergyRefiller += creep.ticksToLive;
        else if (creep.memory.role == 'energyTransporter') {
            roleEnergyTransporter.run(creep);
        } //uses about 0.002 cpu
        else if (creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        } //uses about 0.001 cpu
        else if (creep.memory.role == 'repairer') {
            roleRepairer.run(creep);
        } else if (creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        } //uses about 0.0007 cpu
        else if (creep.memory.role == 'claimer') {
            roleClaimer.run(creep);
        } else if (creep.memory.role == 'fighter') {
            roleFighter.run(creep);
        } else if (creep.memory.role == 'scout') {
            roleScout.run(creep);
        }
    }
    j2 = Game.cpu.getUsed();




    if (Memory.structures == undefined) {
        Memory.structures = {};
    }
    if ((Game.time) % 30 == 0) {
        Memory.structures.repairTargets = [];
        Memory.structures.buildingSites = [];
        for (let room in Game.rooms) {
            if (Game.rooms[room].my != undefined) {
                continue;
            }
            // update repairsites
            // update targets that need repair (below 50% hp)
            var targets = Game.rooms[room].find(FIND_STRUCTURES);
            for (let target of targets) {
                if ((target.structureType == STRUCTURE_ROAD || target.structureType == STRUCTURE_CONTAINER || target.my == true) && target.hits < target.hitsMax * 0.5) {
                    if ((Memory.structures.repairTargets.indexOf(target.id) == -1)) {
                        Memory.structures.repairTargets.push(target.id);
                    }
                }
            }
            // update construction sites
            // update buildingSites targets which are still in construction
            var targets = Game.rooms[room].find(FIND_MY_CONSTRUCTION_SITES);
            for (let target of targets) {
                if ((Memory.structures.buildingSites.indexOf(target.id) == -1)) {
                    Memory.structures.buildingSites.push(target.id);
                }
            }
        }
        //console.log(Memory.structures.buildingSites);
        //console.log(Memory.structures.repairTargets);
    }

    // if buildings and creeps are no longer existing but still in memory
    cleanListOfDeadIDs(Memory.structures.buildingSites);
    cleanListOfDeadIDs(Memory.structures.repairTargets);
    if (Memory.structures != undefined) {
        if (Memory.structures.miningContainers != undefined) {
            cleanListOfDeadIDs(Memory.structures.miningContainers);
            // remove dead creeps from transporter list
            /*for (let i in Memory.energy.energySourceMiners){
                //console.log(Memory.energy.energySourceMiners);
                cleanListOfDeadCreeps(Memory.energy.energySourceMiners[i]);
            }*/
        } else {
            Memory.structures.miningContainers = [];
        }
    }



    if (Memory.energy.totalTransportersRequired == undefined) {
        Memory.energy.totalTransportersRequired = 0;
    }
    //Object.keys(myArray).length
    if (Game.time % 30 == 0) {
        var totalRequiredEnergyTransporters = 0;
        for (let i in Memory.energy.energySources) {
            let source = Game.getObjectById(Memory.energy.energySources[i][0]);
            let nearbyContainer = findEnergy(source, -1, 3, STRUCTURE_CONTAINER, "transfer");
            //console.log(nearbyContainer);
            if (nearbyContainer != undefined) {
                let tempDistance = getDistance(source, Game.spawns.Spawn1);
                let requiredEnergyTransporter = _.ceil(tempDistance / energyTransporterConstant);
                //console.log(source.pos, tempDistance, requiredEnergyTransporter);
                totalRequiredEnergyTransporters += requiredEnergyTransporter;
                if (Memory.energy.energySourceTransporters != undefined) {
                    cleanListOfDeadCreeps(Memory.energy.energySourceTransporters[i]);
                }
            }
        }
        Memory.energy.totalTransportersRequired = totalRequiredEnergyTransporters;
        //console.log(totalRequiredEnergyTransporters);
    }



    var name;
    if (numberOfHarvesters < 2 && (numberOfSourceMiners < 1 || numberOfEnergyRefillers < 1) && energy >= 200 && !spawning) {
        name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'harvester');
        if (name != undefined && isNaN(name)) {
            spawning = true;
            console.log(numberOfHarvesters + 1, "/", "69", "Spawning emergency harvester!", name);
        }
    }


    if ((energy >= energyMax) && !spawning || (numberOfEnergyRefillers < 2 && !spawning)) {
        if (makeAttackUnitsHighPriority) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'fighter', 1, 1, 1, "0", Game.spawns.Spawn1.room.name);
            if (name != undefined && isNaN(name)) {
                console.log(numberOfFighters + 1, "/", "Spawning new fighter!", name);
            }
        } else if ((numberOfSourceMiners < Memory.energy.energySources.length || moreMinersRequired) && numberOfEnergyRefillers >= 2) {
            for (let i in Memory.energy.energySources) {
                array = Memory.energy.energySources[i];
                var sourceID = array[0];
                var maxMiners = array[1];
                var maxWorkBodyParts = array[2];
                var roomName = array[3];
                if (Memory.energy.energySourceMiners != undefined) {
                    if (Memory.energy.energySourceMiners[i] != undefined) {
                        cleanListOfDeadCreeps(Memory.energy.energySourceMiners[i]);
                        var workerCount = 0;
                        if (Memory.energy.energySourceMiners != undefined) {
                            workerCount = Memory.energy.energySourceMiners[i].length;
                        }
                        var tempBodyPartsCount = 0;
                        for (let i2 of Memory.energy.energySourceMiners[i]) {
                            let creep = Game.creeps[i2];
                            tempBodyPartsCount += creep.getActiveBodyparts(WORK);
                        }
                        if (workerCount < maxMiners && tempBodyPartsCount <= maxWorkBodyParts) {
                            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'sourceMiner', sourceID, roomName);
                            if (name != undefined && isNaN(name)) {
                                Memory.energy.energySourceMiners[i].push(name);
                                console.log(numberOfSourceMiners + 1, "/", Memory.energy.energySources.length, "Spawning new sourceMiner!", name);
                                break;
                            }
                        }
                    } else {
                        Memory.energy.energySourceMiners.push([]);
                    }
                } else {
                    Memory.energy.energySourceMiners = [];
                }
            }
        } else if (((combinedTicksEnergyRefiller < 300 || numberOfEnergyRefillers < minimumNumberOfEnergyRefillers) && Memory.energy.energySources.length > 0) || numberOfEnergyRefillers < minimumNumberOfEnergyRefillers && energy >= 300) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyRefiller');
            if (name != undefined && isNaN(name)) {
                console.log(numberOfEnergyRefillers + 1, "/", minimumNumberOfEnergyRefillers, "Spawning new energyRefiller!", name);
            }

        } else if (numberOfEnergyTransporters < Memory.energy.totalTransportersRequired) {
            //console.log("Blocking spawn: energyTransporter");
            for (let i in Memory.energy.energySources) {
                array = Memory.energy.energySources[i];
                var sourceID = array[0];
                if (Memory.energy.energySourceTransporters != undefined) {
                    if (Memory.energy.energySourceTransporters[i] != undefined) {
                        /**so a miner mines 10 energy per tick on average
                        a transporter with 10 carry bodyparts can carry 500 energy ->
                        need to maintain a distance of 50 TO the mining container, but on the way back the transporter is slowed down to 1/5th ?
                        so transporter constant should be around ((distance * 7) / 50);  (7 = 1 to the source, 6 per tick back)
                        1 carry part generates 1 fatigue if loaded, 1 move part decreases fatigue by 2 each tick
                        non loaded: 1 move distance per tick
                        loaded with 10 carry parts: move -> 10 fatigue -> 5 ticks to reduce -> wait 1 more tick -> move
                        so i need one transporter every around 10 distance?! at least
                        */
                        let source = Game.getObjectById(Memory.energy.energySources[i][0]);
                        let nearbyContainer = findEnergy(source, -1, 3, STRUCTURE_CONTAINER, "transfer");
                        if (nearbyContainer != undefined) {
                            let tempDistance = getDistance(source, Game.spawns.Spawn1);
                            let requiredEnergyTransporter = _.ceil(tempDistance / energyTransporterConstant);
                            if (Memory.energy.energySourceTransporters != undefined) {
                                cleanListOfDeadCreeps(Memory.energy.energySourceTransporters[i]);
                            }
                            if (Memory.energy.energySourceTransporters[i].length < requiredEnergyTransporter) {
                                name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyTransporter', sourceID);
                                Memory.energy.energySourceTransporters[i].push(name);
                                break;
                            }
                        }
                    } else {
                        Memory.energy.energySourceTransporters.push([]);
                    }
                } else {
                    Memory.energy.energySourceTransporters = [];
                }
            }
            if (name != undefined && isNaN(name)) {
                console.log(numberOfEnergyTransporters + 1, "/", Memory.energy.totalTransportersRequired, "Spawning new energyTransporter!", name);
            }
        } else if (energy >= 650 && numberOfClaimers < 1){ // newClaimerRequired) {
            for (let i in Memory.claims.claimLocations) {
                var loc = Memory.claims.claimLocations[i];
                var roomName2 = loc[0];
                if (Game.rooms[roomName2] != undefined) {
                    if (Game.rooms[roomName2].controller.my != undefined) {
                        if (Game.rooms[roomName2].controller.reservation == undefined || Game.rooms[roomName2].controller.reservation == "Burny" && Game.rooms[roomName2].controller.reservation.ticksToEnd < 200) {
                            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'claimer', loc[0], loc[1], Game.spawns.Spawn1.room.name);
                            if (name != undefined && isNaN(name)) {
                                Memory.claims.claimClaimers[i].push(name);
                                console.log(numberOfClaimers + 1, "/", "Spawning new claimer!", name);
                                break;
                            }
                        }
                    }
                } else {
                    name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'claimer', loc[0], loc[1], Game.spawns.Spawn1.room.name);
                    if (name != undefined && isNaN(name)) {
                        Memory.claims.claimClaimers[i].push(name);
                        console.log(numberOfClaimers + 1, "/", "Spawning new claimer!", name);
                    }
                }
            }
        } else if (numberOfRepairers < minimumNumberOfRepairers && Memory.energy.energySources.length > 0) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'repairer');
            if (name != undefined && isNaN(name)) {
                console.log(numberOfRepairers + 1, "/", minimumNumberOfRepairers, "Spawning new repairer!", name);
            }
        } else if (numberOfBuilders < minimumNumberOfBuilders && Memory.energy.energySources.length > 0) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'builder');
            if (name != undefined && isNaN(name)) {
                console.log(numberOfBuilders + 1, "/", minimumNumberOfBuilders, "Spawning new builder!", name);
            }
        } else if (numberOfUpgraders < minimumNumberOfUpgraders && Memory.energy.energySources.length > 0 && Memory.structures.miningContainers.length > 0) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'upgrader');
            if (name != undefined && isNaN(name)) {
                console.log(numberOfUpgraders + 1, "/", minimumNumberOfUpgraders, "Spawning new upgrader!", name);
            }

        } else if (makeAttackUnitsLowPriority) {
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'fighter', 1, 1, 1, "0", Game.spawns.Spawn1.room.name);
            if (name != undefined && isNaN(name)) {
                console.log(numberOfFighters + 1, "/", "Spawning new fighter!", name);
            }
        }
    }

    if (Game.time % 600 == 0) {
        console.log("CPU used to run roles:", _.ceil(j2 - j1), "CPU used by other:", _.floor(Game.cpu.getUsed()) - _.ceil(j2 - j1));
    }

    i1 = Game.cpu.getUsed();
    //console.log(Game.spawns.Spawn1.room.lookForAtArea(LOOK_STRUCTURES, 0, 0, 49, 49, true).length);
    //console.log(Game.spawns.Spawn1.room.find(FIND_STRUCTURES).length);
    //console.log("CPUtest", Game.cpu.getUsed() - i1);


    grid = [25, 18, 36, 10];
    // rebuild structures like walls automatically
    if (Game.time % 300 == 0) {
        Memory.tempbuildList = [];
        //console.log("test");
        Memory.tempbuildList = [];
        for (let i = grid[0]; i < grid[2]; i += 2) {
            for (let j = grid[1]; j > grid[3]; j -= 2) {
                Memory.tempbuildList.push([i, j, STRUCTURE_EXTENSION]);
                Memory.tempbuildList.push([i + 1, j - 1, STRUCTURE_EXTENSION]);
            }
        }
        //creates a grid from bottom left to top right

        //console.log("extensions to build:", Memory.tempbuildList);
        //for (let i of Memory.tempbuildList) {
            //Game.spawns.Spawn1.room.createConstructionSite(i[0], i[1], i[2]);
        //}
        for (let i = 7; i < 19; i+=1) {
            if (i != 16){
                Memory.tempbuildList.push([2, i, STRUCTURE_WALL]);
                //Game.spawns.Spawn1.room.createConstructionSite(2, i, STRUCTURE_WALL);
            }
        }
        for (let i = 16; i < 20; i+=1) {
            if (i != 15){
                Memory.tempbuildList.push([i, 10, STRUCTURE_WALL]);
                //Game.spawns.Spawn1.room.createConstructionSite(i, 10, STRUCTURE_WALL);
            }
        }
        for (let i = 7; i < 10; i+=1) {
            if (i != 16){
                Memory.tempbuildList.push([19, i, STRUCTURE_WALL]);
                //Game.spawns.Spawn1.room.createConstructionSite(i, 10, STRUCTURE_WALL);
            }
        }
        Memory.tempbuildList.push([2, 16, STRUCTURE_RAMPART]);
        Memory.tempbuildList.push([19, 9, STRUCTURE_RAMPART]);

        Memory.tempbuildList.push([27, 20, STRUCTURE_STORAGE]);
        if (Game.time > 15189983) {
            Memory.tempbuildList.push([28, 19, STRUCTURE_TOWER]);
        }
    }

    if (Memory.tempbuildList != undefined && Memory.tempbuildList.length > 0){
        //console.log(Memory.tempbuildList.length);
        Game.spawns.Spawn1.room.createConstructionSite(Memory.tempbuildList[0][0], Memory.tempbuildList[0][1], Memory.tempbuildList[0][2]);
        Memory.tempbuildList.splice(0, 1);
    }
};
