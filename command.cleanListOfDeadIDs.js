/*jshint esversion: 6, -W041, -W080, -W018 */

module.exports = function(array) {
    // in case a creep is idle and blocking the way, use this function to make him move out of the way of friendly creeps
    for (let id in array){
        if (Game.getObjectById(array[id]) == null){
            //console.log(array[id], Game.getObjectById(array[id]));
            let index = array.indexOf(array[id]);
            array.splice(index, 1);
            return module.exports(array);
        }
    }
    return array;
};
