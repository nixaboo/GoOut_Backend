const assert = require('assert');
class TaskPool
{
    constructor(concurrent = 1) {
        this.concurrent = concurrent;
        this.tasks = [];
        this.current = [];
        this.timer = null;
        //process failed requests somehow
    }


    addTask (task) {
        this.tasks.push(task);
    }


    tick() {
        this.current = this.current.filter(x => !x.isComplete);

        while(this.current.length < this.concurrent && this.tasks.length > 0) {
            var t = this.tasks.pop();
            this.current.push(t);
            t.start();
        }
    }


    start() {
        assert(this.timer == null);
        this.timer = setInterval(this.tick.bind(this), 100);
    }
}


module.exports = TaskPool;