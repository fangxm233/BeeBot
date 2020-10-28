import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";
import { BeeManager } from "./BeeManager";
import { BeeSetup } from "./BeeSetup";

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
    public name: string;
    public spawned: boolean;

    private static count = 0;

    constructor(bee: Bee, setup: BeeSetup, budget: number, room: string, spawnRoom: string, processId: string, extraMemory?: any, name?: string) {
        this.budget = budget;
        this.setup = setup;
        this.role = bee.role;
        this.room = room;
        this.spawnRoom = spawnRoom;
        this.processId = processId;
        this.bee = bee;
        this.extraMemory = extraMemory;
        this.name = name || '';
        this.id = BeeWish.count++;
    }

    public cancel() {
        if (this.spawned) return;
        BeeManager.wishes[this.spawnRoom].remove(w => w.id == this.id);
    }
}