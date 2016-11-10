/*jshint esversion: 6, -W041, -W080, -W018 */

// uses about 0.05 cpu in same room
module.exports = function(creep, target) {
    // this function returns the path distance from two positions - especially useful if positions are not in the same room (havent found a function for that one yet)
    // how to use:
    // distance = getDistance(creep, target)
    // returns integer
    
    if (creep == undefined || target == undefined){
        console.log("Warning, undefined in getDistance function", creep, target);
    }
    var path = creep.room.findPath(creep.pos, target.pos);
    //console.log(creep.pos, target.pos, path);
    if (creep.room == target.room){
        return creep.pos.getRangeTo(target.pos);
    }
    var distance = Object.keys(path).length;
    if (creep.memory.role == "sourceMiner"){
        console.log(creep.pos, target.pos, distance, path);
    }
    if (distance == undefined){
        return 0;
    }
    return distance;
};
