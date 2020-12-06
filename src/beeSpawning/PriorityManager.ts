import { PROCESS_MINE_SOURCE, ROLE_FILLER, ROLE_MINER } from 'declarations/constantsExport';
import { ProcessMineSource } from 'process/instances/mineSource';
import { profile } from 'profiler/decorator';

@profile
export class PriorityManager {
    private static roomPriority: { [roomName: string]: { [role in ALL_ROLES]: number } } = {};
    private static defaultPriority: { [role in ALL_ROLES]: number } = {} as any;

    public static arrangePriority(roomName: string) {
        const room = Game.rooms[roomName];
        if (!room) return;

        const mineSource = ProcessMineSource.getProcess<ProcessMineSource>(roomName, PROCESS_MINE_SOURCE);
        if (mineSource && !mineSource.bees[ROLE_MINER].length) {
            this.setPriority(roomName, ROLE_FILLER, this.defaultPriority[ROLE_MINER]);
            this.setPriority(roomName, ROLE_MINER, this.defaultPriority[ROLE_FILLER]);
        } else {
            this.goDefault(roomName, ROLE_FILLER);
            this.goDefault(roomName, ROLE_MINER);
        }
    }

    public static getPriority(roomName: string, role: ALL_ROLES) {
        if (!this.roomPriority[roomName]) this.roomPriority[roomName] = _.clone(this.defaultPriority);
        return this.roomPriority[roomName][role];
    }

    public static setPriority(roomName: string, role: ALL_ROLES, priority: number) {
        if (!this.roomPriority[roomName]) this.roomPriority[roomName] = _.clone(this.defaultPriority);
        this.roomPriority[roomName][role] = priority;
    }

    public static swapPriority(roomName: string, role1: ALL_ROLES, role2: ALL_ROLES) {
        if (!this.roomPriority[roomName]) this.roomPriority[roomName] = _.clone(this.defaultPriority);
        const temp = this.roomPriority[roomName][role1];
        this.roomPriority[roomName][role1] = this.roomPriority[roomName][role2];
        this.roomPriority[roomName][role2] = temp;
    }

    public static goDefault(roomName: string, role: ALL_ROLES) {
        if (!this.roomPriority[roomName]) this.roomPriority[roomName] = _.clone(this.defaultPriority);
        this.roomPriority[roomName][role] = this.defaultPriority[role];
    }

    public static setDefaultPriority(role: ALL_ROLES, priority: number) {
        this.defaultPriority[role] = priority;
    }
}