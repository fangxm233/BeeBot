import { Bee } from "Bee/Bee";
import { BeeFactorty } from "Bee/BeeFactory";
import { timer } from "event/Timer";
import { Process } from "process/Process";
import { profile } from "profiler/decorator";
import { timeAfterTick } from "utilities/helpers";
import { BeeManager } from "./BeeManager";
import { BeeSetup } from "./BeeSetup";
import { BeeWish } from "./BeeWish";

export interface WishConfig {
    bee?: Bee;
    role?: ALL_ROLES;
    setup: BeeSetup;
    budget: number;
    count?: number;
    extraMemory?: any;
    name?: string;
}

@profile
export class WishManager {
    public room: string;
    public spawnRoom: string;
    public process: Process;
    private _wishes: BeeWish[] = [];

    constructor(spawnRoom: string, room: string, process: Process) {
        this.room = room;
        this.spawnRoom = spawnRoom;
        this.process = process;
    }

    public wishBee(config: WishConfig) {
        const { setup, budget, extraMemory, name } = config;
        if (config.role) {
            const { count, role } = config;
            for (let i = 0; i < (count || 1); i++) {
                const bee = BeeFactorty.getInstance(role, this.process);
                const wish = new BeeWish(bee, setup, budget, this.room, this.spawnRoom, this.process.fullId, extraMemory, name);
                this._wishes.push(wish);
                BeeManager.wishBee(wish);
            }
        } else {
            const wish = new BeeWish(config.bee!, setup, budget, this.room, this.spawnRoom, this.process.fullId, extraMemory, name);
            this._wishes.push(wish);
            BeeManager.wishBee(wish);
        }
    }

    public arrangeCyclingBees(role: ALL_ROLES, setup: BeeSetup, budget: number, extraMemory?: string[]) {
        for (const bee of this.process.bees[role]) {
            if (bee.arriveTick && !bee.cyclingCallbackId && bee.ticksToLive > bee.arriveTick) {
                const memory: any = {};
                if (extraMemory) {
                    extraMemory.forEach(s => memory[s] = bee.memory[s]);
                }

                bee.cyclingCallbackId = timer.callBackAtTick(timeAfterTick(bee.ticksToLive - bee.arriveTick),
                    () => this.wishBee({ bee: BeeFactorty.getInstance(role, this.process), setup, budget, extraMemory: memory }));
            }
        }
    }

    public clear() {
        this.wishes.forEach(w => w.cancel());
    }

    public getCount(role: ALL_ROLES) {
        _.remove(this._wishes, w => w.spawned);
        return _.filter(this._wishes, wish => wish.bee.role == role).length;
    }

    public get count() {
        _.remove(this._wishes, w => w.spawned);
        return this._wishes.length;
    }

    public get wishes() {
        _.remove(this._wishes, w => w.spawned);
        return this._wishes;
    }
}