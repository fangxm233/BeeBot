import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";
import { BeeManager } from "./BeeManager";
import { BeeSetup } from "./BeeSetup";

export const WISH_ID = 'i';
export const WISH_BUDGET = 'b';
export const WISH_SETUP = 's';
export const WISH_ROLE = 'r';
export const WISH_ROOM = 'rm';
export const WISH_SPAWN_ROOM = 'sRm';
export const WISH_PROCESS_ID = 'pId';
export const WISH_EXTRA_MEMORY = 'eM';
export const WISH_EMERGENCY = 'e';

// tslint:disable-next-line:class-name
export interface protoBeeWish {
    [WISH_ID]: number;
    [WISH_BUDGET]: number;
    [WISH_SETUP]: number;
    [WISH_ROLE]: ALL_ROLES;
    [WISH_ROOM]: string;
    [WISH_SPAWN_ROOM]: string;
    [WISH_PROCESS_ID]: string;
    [WISH_EXTRA_MEMORY]: any;
    [WISH_EMERGENCY]: number;
}

@profile
export class BeeWish {
    public id: number;
    public budget: number;
    public setup: BeeSetup;
    public role: ALL_ROLES;
    public room: string;
    public spawnRoom: string;
    public processId: string;
    public bee: Bee;
    public extraMemory: any;
    public emergency: boolean;
    public name: string;
    public spawned: boolean;

    private static count = 0;

    constructor(bee: Bee, setup: BeeSetup, budget: number, room: string, spawnRoom: string, processId: string,
                extraMemory?: any, emergency?: boolean, name?: string) {
        this.budget = budget;
        this.setup = setup;
        this.role = bee.role;
        this.room = room;
        this.spawnRoom = spawnRoom;
        this.processId = processId;
        this.bee = bee;
        this.extraMemory = extraMemory;
        this.emergency = emergency || false;
        this.name = name || '';
        this.id = BeeWish.count++;
    }

    public cancel() {
        if (this.spawned) return;
        _.remove(BeeManager.wishes[this.spawnRoom][this.role], w => w.id == this.id);
    }

    public get proto(): protoBeeWish {
        return {
            [WISH_ID]: this.id,
            [WISH_BUDGET]: this.budget,
            [WISH_SETUP]: this.setup.id,
            [WISH_ROLE]: this.role,
            [WISH_ROOM]: this.room,
            [WISH_SPAWN_ROOM]: this.spawnRoom,
            [WISH_PROCESS_ID]: this.processId,
            [WISH_EXTRA_MEMORY]: this.emergency,
            [WISH_EMERGENCY]: this.emergency ? 1 : 0,
        }
    }
}