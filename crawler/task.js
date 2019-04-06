const assert = require('assert');
class Task {
    constructor(name, task, options) {
        this.name = name;
        this.task = task;
        this.isRunning = false;
        this.isComplete = false;
        this.isError = false;
        this.options = options;
    }

    start(taskPool) {
        var t = this;
        assert.ok(!this.isRunning);
        this.isRunning = true;
        this.task(taskPool, this.options).then(() => {
            t.isComplete = true;
        }).catch((e) => {
            console.log('ERROR: ' + e);
            t.isError = true;
            t.isComplete = true;
        });
    }

}


module.exports = Task;