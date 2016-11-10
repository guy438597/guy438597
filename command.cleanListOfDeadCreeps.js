/*jshint esversion: 6, -W041, -W080, -W018 */

module.exports = function(array) {
    // in case a creep is idle and blocking the way, use this function to make him move out of the way of friendly creeps
    //console.log(array);
    for (let creep in array) {
        if (Game.creeps[array[creep]] == undefined) {
            let index = array.indexOf(Game.creeps[creep]);
            array.splice(index, 1);
            return module.exports(array);
        }
    }
    return array;
};
