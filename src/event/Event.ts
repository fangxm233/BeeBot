import { profile } from "profiler/decorator";

@profile
export class Event {
    private listeners: { [type: string]: ((arg: any) => any)[] } = {};

    public addEventListener(type: EventType, func: (arg: any) => any) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push(func);
    }

    public invokeEvent(type: EventType, arg?: any) {
        if (!this.listeners[type]) return;
        this.listeners[type].forEach(func => func.apply(undefined, [arg]));
    }
}

export const event = new Event();