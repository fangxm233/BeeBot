export class PriorityQueue<T>{
    private queue: { priority: number, value: T }[] = [];

    public get count() {
        return this.queue.length;
    }

    public enqueue(value: T, priority: number) {
        if (this.count == 0) {
            this.queue.push({ value, priority });
            return;
        }

        for (let i = 0; i < this.queue.length; i++) {
            const element = this.queue[i];
            const nextElememt = this.queue[i + 1];

            if (element.priority == priority) {
                this.queue.splice(i, 0, { value, priority });
                return;
            }
            if (element.priority > priority) {
                if (!nextElememt) {
                    this.queue.push({ value, priority });
                    break;
                }
                else if (nextElememt.priority <= priority) {
                    this.queue.splice(i + 1, 0, { value, priority });
                    break;
                }
            }
            if (element.priority < priority) {
                this.queue.splice(0, 0, { value, priority });
            }
        }
    }

    public dequeue(): T | undefined {
        return this.queue.pop()?.value;
    }

    public remove(iteratee: (value: T, index?: number) => boolean) {
        _.remove(this.queue, iteratee);
    }

    public peek(): T | undefined {
        return _.last(this.queue)?.value;
    }
}