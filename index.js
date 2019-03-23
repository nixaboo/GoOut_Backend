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

var TaskPool = require('./crawler/taskPool');



var pool = new TaskPool();
pool.start();


var t = require('./tasks/clipaTask');

pool.addTask(t);