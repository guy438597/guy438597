# out: default/main.js
console.log "hi"

require('./spawnV2')();
calculations = require("./calculations")
chooseClosest = calculations.chooseClosest
findEnergy = calculations.findEnergy
getDistance = calculations.getDistance
getDistanceInTicks = calculations.getDistanceInTicks
creeproles = require("./creeproles")

#module.exports.loop = class main
class module.exports.loop
    console.log Game.time #test if game server is active
    runRoles = new creeproles()
    #TODO still have to replace Game.spawns.Spawn1 with a loop that loops over all spawns
    #do this at the start to not loop over old creepsaa
    for name, creep of Memory.creeps
        if not creep
            delete Memory.creeps[name]

    # SECTION CUSTOM PARAMETERS
    energyTransporterConstant = 15
    minimumNumberOfUpgraders = 7
    spawnHighPriorityDefense = false
    spawnLowPriorityAttack = false

    Memory.energy = {} if not Memory.energy
    Memory.energy.miningContainers = [] if !Memory.energy.miningContainers
    Memory.energy.energySources = [
        ["57ef9e7a86f108ae6e60f5c3", 3, 5, "E62S49"], #main Spawn1
        ["57ef9e7a86f108ae6e60f5c5", 4, 5, "E62S49"],
        ["57ef9e6786f108ae6e60f3f9", 2, 5, "E61S49"], #west of Spawn1
        ["57ef9e6786f108ae6e60f3fb", 1, 5, "E61S49"],
        #["57ef9e7a86f108ae6e60f5c0", 2, 5, "E62S48"], #north of Spawn1
    ]

    Memory.claims = {} if not Memory.claims
    Memory.claims.claimLocations = [
        ["E61S49", "r"] #west of Spawn1
        #["E62S48", "r"] #north of Spawn1
    ]

    #filter dead miner creeps
    Memory.energy.energySourceMiners = [] if !Memory.energy.energySourceMiners
    for name,i in Memory.energy.energySourceMiners
        Memory.energy.energySourceMiners = Memory.energy.energySourceMiners.filter( (s) -> !Game.creeps[name])


    #define minimum amount of required builders and repairers
    Memory.structures.buildingSites = [] if !Memory.structures.buildingSites
    Memory.structures.repairTargets = [] if !Memory.structures.repairTargets
    minimumNumberOfBuilders = Math.min((Memory.structures.buildingSites.length + 4) // 5, 3)
    minimumNumberOfRepairers = Math.min((Memory.structures.repairTargets.length + 9) // 10, 3)

    #check if we have enough miners, if we dont then make the spawn function create more miners
    moreMinersRequired = false
    Memory.energy.energySourceMiners = [] if !Memory.energy.energySourceMiners
    if Memory.energy.energySourceMiners
        for source, i in Memory.energy.energySources
            maxMiners = Memory.energy.energySources[i][1]
            maxBodyParts = Memory.energy.energySources[i][2]
            countBodyParts = 0
            if Memory.energy.energySourceMiners[i]
                for miner, j in Memory.energy.energySourceMiners
                    countBodyParts += 0
                    for name in Memory.energy.energySourceMiners[i]
                        if name
                            countBodyParts += Game.creeps[name].getActiveBodyparts(WORK)
            else
                Memory.energy.energySourceMiners.push([])
            if Memory.energy.energySourceMiners[i].length < maxMiners and countBodyParts < maxBodyParts
                moreMinersRequired = true
                break

    # CLAIMING SECTION
    Memory.claims.claimClaimers = [] if not Memory.claims.claimClaimers
    Memory.claims.claimClaimers.push([]) while Memory.claims.claimClaimers.length < Memory.claims.claimLocations.length
    for name,i in Memory.claims.claimClaimers
        Memory.claims.claimClaimers = Memory.claims.claimClaimers.filter( (s) -> !Game.creeps[name])

    # calculate if we need a new claimer
    newClaimerRequired = false
    Memory.claims.claimLocations = [] if !Memory.claims.claimLocations
    for location, i in Memory.claims.claimLocations
        roomName = location[0]
        if Game.rooms[roomName]
            if Game.rooms[roomName].controller.my
                if !Game.rooms[roomName].controller.reservation or Game.rooms[roomName].controller.reservation.username is "Burny" and Game.rooms[roomName].controller.reservation.ticksToEnd < 200
                    c = Game.rooms[roomName].controller.pos
                    countWalkableTiles = (lookAtArea(c.y-1, c.x-1, c.y+1, c.x+1, true).filter( (s) -> s.type is "terrain" and (s.terrain is "swamp" or s.terrain is "normal")))
                    if Memory.claims.claimClaimers[i].length < countWalkableTiles.length
                        newClaimerRequired = true
        else
            newClaimerRequired = true

    # calculate spawning conditions
    spawning = Game.spawns.Spawn1.spawning != null
    energy = Game.spawns.Spawn1.room.energyAvailable
    energyMax = Game.spawns.Spawn1.room.energyCapacityAvailable
    minimumNumberOfEnergyRefillers = energyMax // 300

    # SECTION DEFENSES
    # TOWERS
    towers = Game.spawns.Spawn1.room.find(FIND_STRUCTURES)
    towers = towers.filter (s) -> s.structureType == STRUCTURE_TOWER
    for tower in towers
        attackTarget = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, filter: (s) -> s.getActiveBodyparts(HEAL) > 0)
        if attackTarget
            tower.attack(attackTarget)
        else
            healTarget = tower.pos.findClosestByRange(FIND_MY_CREEPS, filter: (s) -> s.hits < s.hitsMax)
            if healTarget
                tower.heal(healTarget)
            else
                repairTarget = tower.pos.findClosestByRange(FIND_MY_STRUCTURES, filter: (s) -> s.hits < s.hitsMax * 0.75)
                tower.repair(repairTarget) if repairTarget

    # update list of constructionsites and repairtargets
    Memory.structures = {} if Memory.structures
    if not (Game.time % 60)
        Memory.structures.repairTargets = []
        Memory.structures.buildingSites = []
        for name,room of Game.rooms
            newrepairTargets = room.find(FIND_STRUCTURES, filter( (s) -> (s.structureType is STRUCTURE_ROAD or s.structureType is STRUCTURE_CONTAINER or s.my) and s.hits < s.hitsMax * repairFactor)
            newbuildingSites = room.find(FIND_MY_CONSTRUCTION_SITES))
            for i in newrepairTargets
                Memory.structures.repairTargets.concat(s.id for s in newrepairTargets)
            for i in newbuildingSites
                Memory.structures.buildingSites.concat(s.id for s in newbuildingSites)
    else
        # if it isnt updating the list, then at least clean the list of "null" targets
        # a target is "null" whenever the Game.getObjectById(ID) is not available - so basically dead IDs
        if Memory.structures.repairTargets
            Memory.structures.repairTargets = Memory.structures.repairTargets.filter (s) -> Game.getObjectById(s) isnt null
        if Memory.structures.buildingSites
            Memory.structures.buildingSites = Memory.structures.buildingSites.filter (s) -> Game.getObjectById(s) isnt null

    # count how many creeps of each role i have
    roleCnt =
        sourceMiner: (item for key,item of Game.creeps when item.memory.role is "sourceMiner").length
        energyRefiller: (item for key,item of Game.creeps when item.memory.role is "energyRefiller").length
        energyTransporter: (item for key,item of Game.creeps when item.memory.role is "energyTransporter").length
        harvester: (item for key,item of Game.creeps when item.memory.role is "harvester").length
        builder: (item for key,item of Game.creeps when item.memory.role is "builder").length
        repairer: (item for key,item of Game.creeps when item.memory.role is "repairer").length
        wallRepairer: (item for key,item of Game.creeps when item.memory.role is "wallRepairer").length
        upgrader: (item for key,item of Game.creeps when item.memory.role is "upgrader").length
        claimer: (item for key,item of Game.creeps when item.memory.role is "claimer").length
        fighter: (item for key,item of Game.creeps when item.memory.role is "fighter").length

    # run all roles
    combinedTicksEnergyRefiller = 0 # if it goes below a certain number, i need a new energyRefiller
    for name, creep of Game.creeps
        if creep.spawning
            continue
        #console.log "logging run roles loop",name, creep, creep.pos, creep.memory.role
        if creep.memory.role is "harvester"
            if roleCnt["sourceMiner"] > 1 and roleCnt["energyRefiller"] > 1 and roleCnt["energyTransporter"] > 1 then creep.suicide() else
        else if creep.memory.role is "energyRefiller"
            combinedTicksEnergyRefiller += creep.ticksToLive;
        #TODO still have to create object with all the role functions
        #import at the top:
        #roles = import('./creeproles')
        #runRoles = new roles()
        runRoles[creep.memory.role](creep)
        #roles[creep.memory.role]() if roles[creep.memory.role]

    # check how many energyTransporters i need
    Memory.energy.totalEnergyTransportersRequired = 0 if !Memory.energy.totalEnergyTransportersRequired
    if !(Game.time % 30)
        totalEnergyTransportersRequired = 0
        for source,i in Memory.energy.energySources
            console.log "buggerino"
            source = Game.getObjectById(Memory.energy.energySources[i][0])
            if source
                # nearbyContainer = findEnergy(source, -1, 3, STRUCTURE_CONTAINER, "transfer")
                closestSpawn = chooseClosest(source, spawn for spawnName,spawn of Game.spawns)
                tempDistance = getDistance(source, closestSpawn)
                totalEnergyTransportersRequired += (tempDistance + energyTransporterConstant - 1) // energyTransporterConstant
        Memory.energy.totalTransportersRequired = totalEnergyTransportersRequired
    else
        Memory.energy.energySourceTransporters = [] if !Memory.energy.energySourceTransporters
        for name,i in Memory.energy.energySourceTransporters[i]
            Memory.energy.energySourceTransporters[i] = Memory.energy.energySourceTransporters[i].filter( (s) -> !Game.creeps[name])

    # SECTION SPAWNING
    basicEconomyRunning = roleCnt.energyMiner > 1 and roleCnt.energyRefiller > 1 and roleCnt.energyTransporter > 1
    if !spawning and (energy >= 300 and not basicEconomyRunning and energy >= 200)
        if energy >= 190 and spawnHighPriorityDefense
            #TODO need to figure out where i want to spawn defensive units
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'fighter', 1, 1, 1, "0", Game.spawns.Spawn1.room.name)
            if name
                console.log roleCnt.fighter + 1, "/", "Spawning new fighter!", name

        else if Math.max(Math.min(650, energy), 200) >= 200 and moreMinersRequired and roleCnt.energyRefiller > 0
            if Memory.energy.energySourceMiners # dont actually need this one
                for source, i in Memory.energy.energySources
                    sourceID = Memory.energy.energySources[i][0]
                    maxMiners = Memory.energy.energySources[i][1]
                    maxBodyParts = Memory.energy.energySources[i][2]
                    sourceRoomName = Memory.energy.energySources[i][3]
                    countBodyParts = 0
                    if Memory.energy.energySourceMiners[i]
                        for miner, j in Memory.energy.energySourceMiners
                            countBodyParts += 0
                            for name in Memory.energy.energySourceMiners[i]
                                if name
                                    countBodyParts += Game.creeps[name].getActiveBodyparts(WORK)
                    else
                        Memory.energy.energySourceMiners.push([])
                    if Memory.energy.energySourceMiners[i].length < maxMiners and countBodyParts < maxBodyParts
                        name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'sourceMiner', sourceID, sourceRoomName)
                        if name
                            console.log roleCnt.sourceMiner + 1, "/", Memory.energy.energySources.length, "Spawning new sourceMiner!", name
                            break

        else if energy >= 150 and (combinedTicksEnergyRefiller < 300 or roleCnt.energyRefiller < 2)
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyRefiller')
            if name
                console.log(roleCnt.energyRefiller + 1, "/", 2, "Spawning new energyRefiller!", name)

        else if energy >= 150 and roleCnt.energyTransporter < Memory.energy.totalTransportersRequired
            for sourceID,i in Memory.energy.energySources
                console.log "buggerino3"
                source = Game.getObjectById(Memory.energy.energySources[i][0])
                if source
                    # nearbyContainer = findEnergy(source, -1, 3, STRUCTURE_CONTAINER, "transfer")
                    closestSpawn = chooseClosest(source, spawn for spawnName,spawn of Game.spawns)
                    tempDistance = getDistance(source, closestSpawn)
                    totalEnergyTransportersRequired = (tempDistance + energyTransporterConstant - 1) // energyTransporterConstant
                    if Memory.energy.energySourceTransporters[i].length < totalEnergyTransportersRequired
                        name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'energyTransporter', sourceID)
                        if name
                            Memory.energy.energySourceTransporters[i].push(name);
            if name
                console.log roleCnt.energyTransporter + 1, "/", Memory.energy.totalTransportersRequired, "Spawning new energyTransporter!", name

        else if energy >= 650 and newClaimerRequired
            for location, i in Memory.claims.claimLocations
                console.log "buggerino4"
                roomName = location[0]
                if Game.rooms[roomName]
                    if Game.rooms[roomName2].controller.my
                        if Game.rooms[roomName2].controller.reservation or Game.rooms[roomName2].controller.reservation.username is "Burny" and Game.rooms[roomName2].controller.reservation.ticksToEnd < 200
                            c = Game.rooms[roomName].controller.pos
                            countWalkableTiles = (lookAtArea(c.y-1, c.x-1, c.y+1, c.x+1, true).filter( (s) -> s.type is "terrain" and (s.terrain is "swamp" or s.terrain is "normal")))
                            if Memory.claims.claimClaimers[i].length < countWalkableTiles.length
                                console.log "buggerino6"
                                name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'claimer', loc[0], loc[1], Game.spawns.Spawn1.room.name)
                                if name
                                    Memory.claims.claimClaimers[i].push(name)
                                    console.log numberOfClaimers + 1, "/", "Spawning new claimer!", name
                else
                    console.log "buggerino5"
                    name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'claimer', loc[0], loc[1], Game.spawns.Spawn1.room.name)
                    if name
                        Memory.claims.claimClaimers[i].push(name);
                        console.log numberOfClaimers + 1, "/", "Spawning new claimer!", name

        else if energy >= 300 and roleCnt.repairer < minimumNumberOfRepairers
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'repairer')
            if name
                console.log roleCnt.repairer + 1, "/", minimumNumberOfRepairers, "Spawning new repairer!", name

        else if energy >= 300 and roleCnt.builder < minimumNumberOfBuilders
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'builder')
            if name
                console.log roleCnt.upgrader + 1, "/", minimumNumberOfBuilders, "Spawning new builder!", name

        else if energy >= 200 and roleCnt.upgrader < minimumNumberOfUpgraders
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'upgrader')
            if name
                console.log roleCnt.upgrader + 1, "/", minimumNumberOfUpgraders, "Spawning new upgrader!", name

        else if energy >= 200 and makeAttackUnitsLowPriority
            name = Game.spawns.Spawn1.createCustomCreepV2(energy, 'fighter', 1, 1, 1, "0", Game.spawns.Spawn1.room.name)
            if name
                console.log roleCnt.fighter + 1, "/", "Spawning new fighter!", name


###
# loop over array
temaList = [
    "yolo"
    "zither"
    "burny"]
returnList = item for item in temaList when item is "yolo" #returns ["yolo"]
console.log returnList

# to loop over objects / dictionaries:
teamlist =
    "burny": 0
    "pino": 1
    "crexis": 2
returnList = item for key,item of temaList when item is 2 #returns [2]
returnList2 = key for key,item of temaList when item is 2 #returns ["crexis"]
    console.log returnList
    console.log returnList2

###
