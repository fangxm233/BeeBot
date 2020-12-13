export class PriorityQueue<T> {
    private queue: { [priority: number]: T[] } = {};

    public get count() {
        return _.sum(this.queue, q => q.length);
    }

    public enqueue(value: T, priority: number) {
        if (!this.queue[priority]) this.queue[priority] = [];

        this.queue[priority].push(value);
    }

    public dequeue(): T | undefined {
        for (const priority in this.queue) {
            if (!this.queue[priority]?.length) continue;
            return this.queue[priority].shift();
        }
        return;
    }

    public remove(iteratee: (value: T, index?: number) => boolean) {
        _.forEach(this.queue, queue => _.remove(queue, iteratee));
    }

    public peek(): T | undefined {
        for (const priority in this.queue) {
            if (!this.queue[priority]?.length) continue;
            return this.queue[priority][0];
        }
        return;
    }

    public peeks = function* (): Generator<T[]> {
        for (const priority in this.queue) {
            if (!this.queue[priority]?.length) continue;
            yield this.queue[priority];
        }
    }
}