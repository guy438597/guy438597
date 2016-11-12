#jshint esversion: 6, -W041, -W080, -W018, -W004

calculations = require("./calculations")
chooseClosest = calculations.chooseClosest
findEnergy = calculations.findEnergy
getDistance = calculations.getDistance
getDistanceInTicks = calculations.getDistanceInTicks

class creeproles
    constructor: ()->

    loadDefaultValues: (creep)->
        creep.memory.retreatRoomName = Game.spawns.Spawn1.room.name if !creep.memory.retreatRoomName

    findConstructionSite: (creep, distance)->
        if !distance
            distance = 10000
        if Memory.structures.buildingSites
            target = chooseClosest(Game.getObjectById(target) for target in Memory.structures.buildingSites)
            #return
            target

    findRepairSite: (creep, distance)->
        if !distance
            distance = 10000
        if Memory.structures.repairTargets
            target = chooseClosest(Game.getObjectById(target) for target in Memory.structures.repairTargets)
            #return
            target

    findNearbyDroppedEnergy: (creep, distance)->
        if distance
            target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, filter: (s) -> creep.pos.getRangeTo(s.pos) <= distance)
            if target
                creep.memory.target = target.id
                #return
                target
        else
            target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY)
            creep.memory.target = target.id
            #return
            target

    findStructureToWithdraw: (creep, structureType = STRUCTURE_CONTAINER, distance = 100000, energy = creep.carryCapacity - creep.carry.energy, excludeListIDs = [])->
            #target = creep.pos.findClosestByPath(FIND_STRUCTURES, filter: (s) -> s.structureType == structureType and s.store[RESOURCE_ENERGY] >= creep.carry.energy and creep.pos.getRangeTo(s.pos) <= distance)
        target = findEnergy(creep, energy, distance, structureType, "withdraw", excludeListIDs)

            #target = chooseClosest(creep.room.find(FIND_STRUCTURES, filter: (s) -> s.structureType == structureType and s.store[RESOURCE_ENERGY] >= creep.carry.energy and creep.pos.getRangeTo(s.pos) <= distance))
        if target
            #return
            target

    findStructureToDeposit: (creep, structureType, distance = 100000, energy = creep.carry.energy, excludeListIDs = []) ->
        structureType = STRUCTURE_CONTAINER if !structureType
        if structureType in [STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION]
            #console.log "testo48955", creep.room.find(FIND_STRUCTURES, filter: (s) -> s.structureType == structureType and s.energy < s.energyCapacity and creep.pos.getRangeTo(s.pos) <= distance)
            target = chooseClosest(creep, creep.room.find(FIND_STRUCTURES, filter: (s) -> s.structureType == structureType and s.energy < s.energyCapacity and creep.pos.getRangeTo(s.pos) <= distance))
        else
            target = findEnergy(creep, energy, distance, structureType, "transfer", excludeListIDs)
        if target
            #return
            target

    findMiningSite: (creep, distance)->
        if !distance
            distance = 10000
        target = creep.pos.findClosestByPath(FIND_SOURCES, filter: (s) -> creep.pos.getRangeTo(s.pos) <= distance)
        #return
        target

    goBuild: (creep, target)->
        if target
            creep.memory.target = target.id
            if target.progress
                if target.progress < target.progressTotal
                    if creep.repair(target) is ERR_NOT_IN_RANGE
                        creep.say("RPR " + target.pos.x + "," + target.pos.y)
                        @costEfficientMove(creep, target)
                else
                    creep.memory.target = undefined
            else
                creep.memory.target = undefined

    goRepair: (creep, target)->
        if target
            creep.memory.target = target.id
            if target.hits
                if target.hits < target.hitsMax * 0.99
                    if creep.build(target) is ERR_NOT_IN_RANGE
                        creep.say("BLD " + target.pos.x + "," + target.pos.y)
                        @costEfficientMove(creep, target)
                else
                    creep.memory.target = undefined
            else
                creep.memory.target = undefined

    goTransferEnergy: (creep, target)->
        if target
            creep.memory.target = target.id
            if creep.transfer(target, RESOURCE_ENERGY) is ERR_NOT_IN_RANGE
                creep.say("MOVE TRNSFR")
                @costEfficientMove(creep, target)
            else
                creep.say("TRANSFER")

    goWithdrawEnergy: (creep, target)->
        if target
            creep.memory.target = target.id
            if !target.storeCapacity
                @goPickUpEnergy(creep, target)
            else if creep.withdraw(target, RESOURCE_ENERGY) is ERR_NOT_IN_RANGE
                creep.say("MOVE WITHDRAW")
                @costEfficientMove(creep, target)
                creep.memory.target = target.id
                1
            else
                creep.say("WITHDR E")
                creep.memory.target = undefined
                1
        else
            creep.memory.target = undefined
            -1

    goPickUpEnergy: (creep, target)->
        if target
            creep.memory.target = target.id
            if target.storeCapacity
                @goWithdrawEnergy(creep, target)
            else if creep.pickup(target) is ERR_NOT_IN_RANGE
                creep.say("MOVE PICKUP")
                @costEfficientMove(creep, target)
                creep.memory.target = target.id
                1
            else
                creep.say("PICKUP E")
                creep.memory.target = undefined
                1
        else
            creep.memory.target = undefined
            -1

    retreat: (creep, distance)->
        distance = 2 if !distance
        creep.say("RETREAT")
        @costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.retreatRoomName))

    costEfficientMove: (creep, target) ->
        if target
            if creep.moveTo(target, {noPathFinding: false}) is ERR_NOT_FOUND
                creep.moveTo(target)

    moveOutOfTheWay: (creep)->
        otherCreep = creep.pos.findClosestByRange(FIND_MY_CREEPS, filter: (s) -> s isnt creep and creep.pos.getRangeTo(s) <= 2)
        if otherCreep
            creep.say("AVOID")
            creep.move((4 + creep.pos.getDirectionTo(otherCreep) + Math.floor((Math.random() * 3) - 1)) % 8);

    goMine: (creep, target)->
        if target #we have a target, so probably our mining source
            if creep.memory.energySourceRoomName isnt creep.room.name
                creep.say("MINE "+ creep.memory.energySourceRoom)
                @costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.energySourceRoomName))
            else
                creep.say("MINING")
                if creep.harvest(target) is ERR_NOT_IN_RANGE
                    @costEfficientMove(creep, target)
        else
            console.log "THIS SHOULD NEVER BE REACHED! ERROR IN MINING COMMAND"

    dying: (creep)->
        if creep.carry.energy > 0
            if !target
                t1 = @findStructureToDeposit(creep, STRUCTURE_CONTAINER)
                t2 = @findStructureToDeposit(creep, STRUCTURE_STORAGE)
                target = chooseClosest(creep, [t1, t2])
            if target and creep.carry.energy
                @goTransferEnergy(creep, target)
            else
                @moveOutOfTheWay(creep)
        else
            @moveOutOfTheWay(creep)

    sourceMiner: (creep)->
        #the miner creep: retreats if enemys are in the room, else goes mining if inventory not full, else transfers inventory to nearby container, if there is no container: build one, if there is a container but is full: drop energy to the ground, after trying to drop energy: find nearby dropped energy and pick it up before it expires (this can happen when the miner mines too much or if the container was full)
        @loadDefaultValues(creep)
        creep.memory.energySource = creep.pos.findClosestByRange(FIND_SOURCES).id if !creep.memory.energySource
        creep.memory.energySourceRoomName = Game.getObjectById(creep.memory.energySource).room.name if !creep.memory.energySourceRoomName
        creep.memory.state = "mining" if !creep.memory.state
        creep.memory.target = creep.memory.energySource if !creep.memory.target and creep.memory.state == "mining"
        target = Game.getObjectById(creep.memory.target) if creep.memory.target

        if creep.room.find(FIND_HOSTILE_CREEPS).length > 0 and !creep.room.safeMode #if there are hostile creeps in this room AND the room is NOT in safemode -> retreat ... mayber later optimize so that it checks a room BEFORE going into a room
            @retreat(creep)
        else if creep.memory.state is "mining"
            if !target
                console.log "CREEP SHOULD NEVER HAVE NO TARGET, ERROR IN MINER SCRIPT"
                @findMiningSite(creep)
            if target
                @goMine(creep, target)
        else if creep.memory.state is "puttingEnergyInContainer"
            if !target
                target = @findStructureToDeposit(creep, STRUCTURE_CONTAINER, 2)
            if target
                if target not in Memory.energy.miningContainers
                    Memory.energy.miningContainers.push(target.id)
                if _.sum(target.store) < target.storeCapacity
                    @goTransferEnergy(creep, target)
                    creep.say("PUT CNTR")
                else
                    creep.say("CNTR FULL")
                    creep.drop(RESOURCE_ENERGY)
                    creep.memory.state = "mining"
            else
                if !target
                    target = @findConstructionSite(creep, 2)
                if target
                    @goBuild(creep, target)
                    creep.say("BLD CNTR")
                else
                    creep.say("NO CNTR")
                    creep.drop(RESOURCE_ENERGY)
                    creep.memory.state = "mining"
        else if creep.memory.state is "lookingForNearbyEnergy"
            if !target
                @findNearbyDroppedEnergy(creep, distance)
            if target
                @goPickUpEnergy(creep, target)
            else
                creep.memory.state = "mining"

    energyRefiller: (creep) ->
        #the refiller creep: picks up energy from either a storage / container nearby, or from dropped energy source, then goes to EXTENSION or SPAWN or TOWER to refill their energy state - he doesnt have to flee because he will always be near a spawn i think
        @loadDefaultValues(creep)
        #creep.memory.state = "mining" if !creep.memory.state
        target = Game.getObjectById(creep.memory.target) if creep.memory.target
        creep.memory.state = "pickupEnergy" if !creep.memory.state
        #creep.memory.target = creep.memory.energySource if !creep.memory.target and creep.memory.state == "mining"
        creep.memory.state = if 0 is creep.carry.energy then "pickupEnergy" else "deliverEnergy"

        if creep.room.find(FIND_HOSTILE_CREEPS).length > 0 and !creep.room.safeMode #if there are hostile creeps in this room AND the room is NOT in safemode -> retreat ... mayber later optimize so that it checks a room BEFORE going into a room
            retreat(creep)
        else if creep.memory.state is "pickupEnergy"
            if !target
                target = @findNearbyDroppedEnergy(creep, 5)
            if !target
                target = @findStructureToWithdraw(creep, undefined, undefined, undefined, Memory.energy.miningContainers)
                #console.log "test1", target
            if !target
                target = @findStructureToWithdraw(creep)
                creep.memory.target = undefined if target.store[RESOURCE_ENERGY] < creep.carryCapacity - creep.carry.energy
                #console.log "test2", target
            if target
                @goWithdrawEnergy(creep, target)
        else if creep.memory.state is "deliverEnergy"
            if !target
                target = @findStructureToDeposit(creep, STRUCTURE_EXTENSION)
            if !target
                target = @findStructureToDeposit(creep, STRUCTURE_SPAWN)
                if !target
                    target = @findStructureToDeposit(creep, STRUCTURE_TOWER)
            if target
                @goTransferEnergy(creep, target)
                creep.memory.target = undefined if target.energyCapacity is target.energy
            else
                @moveOutOfTheWay(creep)
        else if creep.memory.state is "dying"
            @dying(creep)

    energyTransporter: (creep) ->
        @loadDefaultValues(creep)
        #creep.memory.state = "mining" if !creep.memory.state
        creep.memory.state = if creep.carry.energy is creep.carryCapacity then "deliverEnergy" else "pickupEnergy"

        if !creep.memory.source
            console.log creep.name, creep.role, "has no energy sourceID in memory!"
        creep.memory.target = creep.memory.source if creep.memory.state is "pickupEnergy" and !creep.memory.target
        target = Game.getObjectById(creep.memory.target) if creep.memory.target
        #creep.memory.target = creep.memory.energySource if !creep.memory.target and creep.memory.state == "mining"

        if creep.room.find(FIND_HOSTILE_CREEPS).length > 0 and !creep.room.safeMode #if there are hostile creeps in this room AND the room is NOT in safemode -> retreat ... mayber later optimize so that it checks a room BEFORE going into a room
            retreat(creep)
        else if creep.memory.state is "pickupEnergy"
            if target
                if creep.memory.energySourceRoomName != creep.room.name
                    @costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.energySourceRoomName))
                else if creep.pos.getRangeTo(target) <= 5
                    target = @findNearbyDroppedEnergy(creep, 5)
                    if !target
                        target = @findStructureToWithdraw(creep)
                    if target
                        @goWithdrawEnergy(creep, target)
                        creep.memory.target = undefined if target.store[RESOURCE_ENERGY] < creep.carryCapacity - creep.carry.energy
            else
                console.log creep.name, creep.pos, creep.target, creep.memory.source, "programm should never get here, in energyTransporter!"
        else if creep.memory.state is "deliverEnergy"
            t1 = @findStructureToDeposit(creep, STRUCTURE_CONTAINER)
            t2 = @findStructureToDeposit(creep, STRUCTURE_STORAGE)
            target = chooseClosest(creep, [t1, t2])
            if target and creep.carry.energy
                @goTransferEnergy(creep, target)
                creep.memory.target = undefined if target.storeCapacity - target.store[RESOURCE_ENERGY] > creep.carryCapacity
            else
                moveOutOfTheWay(creep)
        else if creep.memory.state is "dying"
            dying(creep)

    repairer: (creep) ->
        @loadDefaultValues(creep)
        #creep.memory.state = "mining" if !creep.memory.state
        target = Game.getObjectById(creep.memory.target) if creep.memory.target
        #creep.memory.target = creep.memory.energySource if !creep.memory.target and creep.memory.state == "mining"

        if creep.room.find(FIND_HOSTILE_CREEPS).length > 0 and !creep.room.safeMode #if there are hostile creeps in this room AND the room is NOT in safemode -> retreat ... mayber later optimize so that it checks a room BEFORE going into a room
            retreat(creep)
        else if creep.memory.state is "pickupEnergy"
            if !target
                target = @findNearbyDroppedEnergy(creep, 5)
            if !target
                target = @findStructureToWithdraw(creep)
            if target
                @goWithdrawEnergy(creep, target)
        else if creep.memory.state is "repairing"
            if target
                @findRepairSite(creep)
            if !target
                @goRepair(creep, target)
            else
                @moveOutOfTheWay(creep)

    builder: (creep) ->
        @loadDefaultValues(creep)
        #creep.memory.state = "mining" if !creep.memory.state
        target = Game.getObjectById(creep.memory.target) if creep.memory.target
        #creep.memory.target = creep.memory.energySource if !creep.memory.target and creep.memory.state == "mining"

        if creep.room.find(FIND_HOSTILE_CREEPS).length > 0 and !creep.room.safeMode #if there are hostile creeps in this room AND the room is NOT in safemode -> retreat ... mayber later optimize so that it checks a room BEFORE going into a room
            @retreat(creep)
        else if creep.memory.state is "pickupEnergy"
            if !target
                target = @findNearbyDroppedEnergy(creep, 5)
            if !target
                target = @findStructureToWithdraw(creep)
            if target
                @goWithdrawEnergy(creep, target)
            else
                @moveOutOfTheWay(creep)
        else if creep.memory.state is "building"
            if target
                @findRepairSite(creep)
            if !target
                @goRepair(creep, target)
            else
                @moveOutOfTheWay(creep)

    claimer: (creep) ->
        @loadDefaultValues(creep)
        target = Game.getObjectById(creep.memory.target) if creep.memory.target
        creep.memory.claimRoomName = Game.spawns.Spawn1.room.name if !creep.memory.claimRoomName
        creep.memory.retreatRoom = Game.spawns.Spawn1.room.name if !creep.memory.retreatRoom
        creep.memory.claimOption = "r" if !creep.memory.claimOption

        if creep.room.find(FIND_HOSTILE_CREEPS).length > 0 and !creep.room.safeMode #if there are hostile creeps in this room AND the room is NOT in safemode -> retreat ... mayber later optimize so that it checks a room BEFORE going into a room
            @retreat(creep)
        else if creep.room.name isnt creep.memory.claimRoomName
            creep.say("CLAIMER")
            @costEfficientMove(creep, new RoomPosition(25, 25, creep.memory.claimRoomName))
        else if creep.memory.claimOption is "r"
            if creep.room.controller
                creep.say("Rsv " + creep.memory.claimRoomName)
                if creep.reserveController(creep.room.controller) is ERR_NOT_IN_RANGE
                    @costEfficientMove(creep, creep.room.controller)

        else if creep.memory.claimOption is "c"
            if creep.room.controller
                creep.say("Clm " + creep.memory.claimRoomName)
                if creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE
                    @costEfficientMove(creep, creep.room.controller)
        else
            @moveOutOfTheWay(creep)

    upgrader: (creep) ->
        @loadDefaultValues(creep)
        #creep.memory.state = "mining" if !creep.memory.state
        target = Game.getObjectById(creep.memory.target) if creep.memory.target
        #creep.memory.target = creep.memory.energySource if !creep.memory.target and creep.memory.state == "mining"

        if creep.room.find(FIND_HOSTILE_CREEPS).length > 0 and !creep.room.safeMode #if there are hostile creeps in this room AND the room is NOT in safemode -> retreat ... mayber later optimize so that it checks a room BEFORE going into a room
            @retreat(creep)
        else if creep.memory.state is "pickupEnergy"
            if !target
                target = @findNearbyDroppedEnergy(creep, 5)
            if !target
                target = @findStructureToWithdraw(creep)
            if target
                @goWithdrawEnergy(creep, target)
            else
                @moveOutOfTheWay(creep)
        else if creep.memory.state is "upgrading"
            if creep.upgradeController(creep.room.controller) is ERR_NOT_IN_RANGE
                @costEfficientMove(creep, creep.room.controller)
        else if creep.memory.state is "dying"
            dying(creep)

    fighter: (creep) ->
        @loadDefaultValues(creep)
        target = Game.getObjectById(creep.memory.target) if creep.memory.target
        console.log "testerinoo"

    harvester: (creep) ->
        @loadDefaultValues(creep)
        creep.carry.state = if !creep.memory.state and creep.carry.energy == 0 then "mine" else "work"
        target = Game.getObjectById(creep.memory.target) if creep.memory.target

        if creep.carry.state is "mine"
            target = @findMiningSite(creep)
            if target
                @goMine(creep, target)
        else if creep.carry.state is "work"
            if !target
                target = findStructureToDeposit(creep, STRUCTURE_TOWER)
            if !target
                target = findStructureToDeposit(creep, STRUCTURE_EXTENSION)
                if !target
                    target = findStructureToDeposit(creep, STRUCTURE_SPAWN)
            if target
                @goTransferEnergy(creep, target)
            else
                @moveOutOfTheWay(creep)



module.exports = creeproles
