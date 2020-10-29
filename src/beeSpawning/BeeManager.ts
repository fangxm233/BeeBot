import { bees } from "Bee/Bee";
import { BeeFactorty } from "Bee/BeeFactory";
import { log } from "console/log";
import { repeater } from "event/Repeater";
import { timer } from "event/Timer";
import { ProcessFilling } from "process/instances/filling";
import { Process, STATE_ACTIVE } from "process/Process";
import { PROCESS_FILLING } from "process/Processes";
import { profile } from "profiler/decorator";
import { calBodyCost } from "utilities/helpers";
import { PriorityQueue } from "utilities/PriorityQueue";
import { getFreeKey } from "utilities/utils";
import { BeeWish } from "./BeeWish";

@profile
export class BeeManager {
    public static collectors: ProcessWishInvoker[] = [];
    public static wishes: { [roomName: string]: PriorityQueue<BeeWish> } = {};

    public static run() {
        for (const roomName in this.wishes) {
            const queue = this.wishes[roomName];
            if (!queue) continue;
            const room = Game.rooms[roomName];
            if (!room) {
                this.wishes[roomName] = undefined as any;
                continue;
            }
            if (!queue.count) continue;
            const wish = queue.peek();
            if (!wish) continue;

            const process = Process.getProcess<Process>(wish.processId);
            if (!process) {
                queue.dequeue();
                continue;
            }

            const spawn = room.spawns.find(spawn => !spawn.spawning);
            if (!spawn) continue;

            const availableEnergy = room.energyAvailable;
            const capacity = room.energyCapacityAvailable;
            const body = wish.setup.generateCreepBody(wish.budget == Infinity ? capacity : wish.budget);
            const cost = calBodyCost(body);
            if (cost > availableEnergy) {
                const process = Process.getProcess<ProcessFilling>(roomName, PROCESS_FILLING);
                if (process && process.state != STATE_ACTIVE) process.awake();
                continue;
            }

            queue.dequeue();
            wish.spawned = true;
            let name = wish.name;
            if (!name) name = wish.role + '_' + getFreeKey(bees, wish.role + '_');
            const code = spawn.spawnCreep(body, name, { memory: wish.extraMemory }); // TODO: 使用消耗顺序
            if (code === OK) {
                wish.bee.creep = Game.creeps[name];
                bees[name] = wish.bee;
                process.registerBee(wish.bee, wish.role);
            } else {
                log.error(`can't spawn creep! name: ${name} body: ${body}`);
            }
        }
    }

    public static clearDiedBees() {
        for (const beeName in bees) {
            const bee = bees[beeName];
            if (!bee) continue;
            if (!Game.creeps[beeName]) {
                bees[beeName] = undefined as any;
                // 为了防止在Bee意外死亡后重复生成
                if (bee.cyclingCallbackId) timer.cancelCallBack(bee.cyclingCallbackId);
                if (!bee.process.closed) bee.process.removeBee(beeName);
                if (Memory.creeps[beeName]) Memory.creeps[beeName] = undefined as any;
            }
        }

        // 只是检查下没有漏掉的项
        if (Game.time % 100 == 0) {
            for (const creepName in Memory.creeps) {
                if (!Game.creeps[creepName]) {
                    bees[creepName] = undefined as any;
                    Memory.creeps[creepName] = undefined as any;
                }
            }
        }
    }

    public static wishBee(wish: BeeWish) {
        if (!this.wishes[wish.spawnRoom]) this.wishes[wish.spawnRoom] = new PriorityQueue();
        this.wishes[wish.spawnRoom].enqueue(wish, BeeFactorty.getRolePriority(wish.role));
    }

    public static addProcess(id: string, interval: number) {
        let collector = this.collectors.find(c => c.interval == interval);
        if (collector) collector.addProcess(id);
        else {
            collector = new ProcessWishInvoker(interval);
            collector.addProcess(id);
            this.collectors.push(collector);
            collector.start();
        }
    }
}

// tslint:disable-next-line: max-classes-per-file
@profile
export class ProcessWishInvoker {
    public interval: number;
    private processId: string[] = [];

    constructor(interval: number) {
        this.interval = interval;
    }

    public start() {
        repeater.addAction(this.interval, this, this.collect, () => undefined);
    }

    private collect() {
        this.processId = this.processId.filter(id => !!Process.getProcess(id));
        this.processId.forEach(id => {
            const process = Process.getProcess<Process>(id);
            if (process) process.wishCreeps();
        });
        return OK;
    }

    public addProcess(id: string) {
        const process = Process.getProcess<Process>(id);
        if (!process) return;
        this.processId.push(id);
        process.wishCreeps();
    }
}

(global as any).BeeManager = BeeManager;