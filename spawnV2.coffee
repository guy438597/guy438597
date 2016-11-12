
module.exports = () ->
    StructureSpawn.prototype.createCustomCreepV2 = (energy, roleName, arg1="0", arg2="0", arg3="0", arg4="0", arg5="0") ->
        costDictionary =
            WORK: 100
            CARRY: 50
            MOVE: 50
            TOUGH: 10
            ATTACK: 80
            CLAIM: 600
        body = [];
        numberOfParts = 0;
        hitpoints = 0;
        if roleName is "harvester"
            # return
            @createCreep([WORK, MOVE, CARRY], undefined,
                role: roleName)
        else if roleName == "sourceMiner" and energy >= 200
            numberOfParts = (energy - 100) // 100
            numberOfParts = Math.min(5, numberOfParts)
            body.push(CARRY)
            body.push(MOVE)
            for i in [1..numberOfParts]
                body.push(WORK)
            # return
            #TODO i might have to add "this" or "@" before "createCreep"
            @createCreep(body, undefined,
                role: roleName
                state: undefined
                source: arg1
                energySourceRoom: arg2)

        else if roleName == "builder" and energy >= 300
            numberOfParts = (energy - 300) // 50
            numberOfParts = Math.min(5, numberOfParts)
            body.push(CARRY)
            body.push(CARRY)
            body.push(MOVE)
            body.push(MOVE)
            body.push(WORK)
            for i in [1..numberOfParts]
                body.push(CARRY)
            # return
            @createCreep(body, undefined,
                role: roleName)
        else if roleName == "upgrader" and energy >= 200
            numberOfParts = (energy - 100) // 100
            numberOfParts = Math.min(4, numberOfParts)
            body.push(MOVE)
            body.push(CARRY)
            for i in [1..numberOfParts]
                body.push(WORK)
            # return
            @createCreep(body, undefined,
                role: roleName)
        else if roleName == "energyRefiller" and energy >= 300
            numberOfParts = (energy - 150) // 200
            console.log numberOfParts
            numberOfParts = Math.min(2, numberOfParts)
            console.log numberOfParts
            body.push(MOVE)
            body.push(CARRY)
            body.push(CARRY)
            for i in [1..numberOfParts]
                body.push(MOVE)
                body.push(CARRY)
                body.push(CARRY)
            console.log body
            # return
            @createCreep(body, undefined,
                role: roleName)
        else if roleName == "energyTransporter" and energy >= 150
            numberOfParts = (energy - 150) // 150
            numberOfParts = Math.min(10, numberOfParts)
            body.push(MOVE)
            body.push(CARRY)
            body.push(CARRY)
            for i in [1..numberOfParts]
                body.push(MOVE)
                body.push(CARRY)
                body.push(CARRY)
            # return
            @createCreep(body, undefined,
                role: roleName
                state: undefined
                source: arg1)
        else if roleName == "repairer" and energy >= 300
            numberOfParts = (energy - 300) // 50
            numberOfParts = Math.min(5, numberOfParts)
            body.push(CARRY)
            body.push(CARRY)
            body.push(MOVE)
            body.push(MOVE)
            body.push(WORK)
            for i in [1..numberOfParts]
                body.push(CARRY)
            @createCreep(body, undefined,
                role: roleName)
        else if (roleName == "fighter" && energy >= 380)
            numberOfParts = (energy - 0) // 190
            for i in [1..numberOfParts]
                body.push(TOUGH)
            for i in [1..numberOfParts]
                body.push(MOVE)
                body.push(ATTACK)
                body.push(MOVE)
            @createCreep(body, undefined,
                role: roleName
                state: undefined
                roomToDefend: arg4
                retreatRoom: arg5)
        else if roleName == "claimer" and energy >= 650
            numberOfParts = (energy - 650) // 1
            numberOfParts = Math.min(48, numberOfParts)
            body.push(CLAIM)
            body.push(MOVE)
            @createCreep(body, undefined,
                role: roleName
                state: undefined
                claimRoomName: arg1
                claimOption: arg2
                retreatRoomName: arg3)
        else if (roleName == "wallRepairer")
            @createCreep([WORK, MOVE, CARRY], undefined,
                role: roleName)
