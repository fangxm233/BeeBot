import { profile } from "profiler/decorator";

@profile
export class Clock {
    private actions: { [interval: number]: { [start: number]: (() => any)[] } } = {};

    public tick() {
        for (const interval in this.actions) {
            const actionGroup = this.actions[interval];
            const remainder = Game.time % Number(interval);
            const actions = actionGroup[remainder];
            if (!actions) continue;
            actions.forEach(action => action.apply(undefined));
        }
    }

    public addAction(interval: number, action: (...arg: any) => any) {
        const start = Game.time % interval;
        if (!this.actions[interval]) this.actions[interval] = {};
        if (!this.actions[interval][start]) this.actions[interval][start] = [];
        this.actions[interval][start].push(action);
    }
}

export const clock = new Clock();