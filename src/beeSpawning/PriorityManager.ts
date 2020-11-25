import { profile } from "profiler/decorator";

@profile
export class PriorityManager {
    private static roomPriority: { [roomName: string]: { [role in ALL_ROLES]: number } } = {};
    private static defaultPriority: { [role in ALL_ROLES]: number } = {} as any;

    public static arrangePriority(roomName: string) {
        const room = Game.rooms[roomName];
        if (!room) return;
    }

    public static getPriority(roomName: string, role: ALL_ROLES) {
        if (!this.roomPriority[roomName]) this.roomPriority[roomName] = _.clone(this.defaultPriority);
        return this.roomPriority[roomName][role];
    }

    public static setPriority(roomName: string, role: ALL_ROLES, priority: number) {
        if (!this.roomPriority[roomName]) this.roomPriority[roomName] = _.clone(this.defaultPriority);
        this.roomPriority[roomName][role] = priority;
    }

    public static setDefaultPriority(role: ALL_ROLES, priority: number) {
        this.defaultPriority[role] = priority;
    }
}