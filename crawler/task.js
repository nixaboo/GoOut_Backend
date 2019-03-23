const assert = require('assert');
class Task {
    constructor(name, task) {
        this.name = name;
        this.task = task;
        this.isRunning = false;
        this.isComplete = false;
        this.isError = false;
    }

    start() {
        var t = this;
        assert.ok(!this.isRunning);
        this.isRunning = true;
        this.task().then(() => {
            t.isComplete = true;
        }).catch((e) => {
            t.isError = true;
            t.isComplete = true;
        });
    }

}


module.exports = Task;