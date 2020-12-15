import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";
import { BeeManager } from "./BeeManager";
import { BeeSetup } from "./BeeSetup";

// tslint:disable-next-line:class-name
export interface protoBeeWish {
    id: number;
    budget: number;
    setup: number;
    role: ALL_ROLES;
    room: string;
    spawnRoom: string;
    processId: string;
    extraMemory: any;
    emergency: boolean;
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

    public get proto() {
        return {
            id: this.id,
            budget: this.budget,
            setup: this.setup.id,
            role: this.role,
            room: this.room,
            spawnRoom: this.spawnRoom,
            processId: this.processId,
            extraMemory: this.extraMemory,
            emergency: this.emergency,
        }
    }
}