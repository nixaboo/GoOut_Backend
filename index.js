var request = require('request');
var fs = require('fs');
var moment = require('moment');
global.Promise=require("bluebird");

Object.defineProperty(Array.prototype, 'flat', {
    value: function(depth = 1) {
        return this.reduce(function (flat, toFlatten) {
            return flat.concat((Array.isArray(toFlatten) && (depth-1)) ? toFlatten.flat(depth-1) : toFlatten);
        }, []);
    }
});

function start() { 
    var TaskPool = require('./crawler/taskPool');


    //ADDED NEW CODE
    var pool = new TaskPool();
    pool.start();
    
    
    //var t = require('./tasks/clipaTask');
    var t = require('./tasks/barbyTask');
    
    pool.addTask(t);
}


start();