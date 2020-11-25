import { bees } from "Bee/Bee";
import { ROLE_FILLER } from "Bee/BeeFactory";
import { log } from "console/log";
import { repeater } from "event/Repeater";
import { timer } from "event/Timer";
import { ProcessFilling } from "process/instances/filling";
import { Process, STATE_ACTIVE } from "process/Process";
import { PROCESS_FILLING } from "process/Processes";
import { profile } from "profiler/decorator";
import { calBodyCost, timeAfterTick } from "utilities/helpers";
import { getFreeKey } from "utilities/utils";
import { BeeWish } from "./BeeWish";
import { PriorityManager } from "./PriorityManager";

@profile
export class BeeManager {
    public static collectors: ProcessWishInvoker[] = [];
    public static wishes: { [roomName: string]: { [role in ALL_ROLES]: BeeWish[] } } = {};

    public static run() {
        for (const roomName in this.wishes) {
            const room = Game.rooms[roomName];
            if (!room) {
                this.wishes[roomName] = undefined as any;
                continue;
            }

            if (!this.wishCount(roomName)) continue;
            const wish = this.peekWish(roomName);
            if (!wish) continue;

            const process = Process.getProcess<Process>(wish.processId);
            if (!process) {
                this.dequeueWish(roomName);
                continue;
            }

            const spawn = room.spawns.find(spawn => !spawn.spawning);
            if (!spawn) continue;

            const availableEnergy = room.energyAvailable;
            let capacity = room.energyCapacityAvailable;
            const filling = Process.getProcess<ProcessFilling>(roomName, PROCESS_FILLING);
            if (filling?.bees[ROLE_FILLER].length == 0 || !filling?.energyEnough) capacity = availableEnergy;

            const body = wish.setup.generateCreepBody(wish.budget == Infinity ? Math.max(capacity, 300) : wish.budget);
            if (body.length == 0) return; // TODO: 对能量不足做出反应
            const cost = calBodyCost(body);
            if (cost > availableEnergy) {
                const process = Process.getProcess<ProcessFilling>(roomName, PROCESS_FILLING);
                if (process && process.state != STATE_ACTIVE) process.awake();
                continue;
            }

            this.dequeueWish(roomName);
            wish.spawned = true;
            let name = wish.name;
            if (!name) name = wish.role + '_' + getFreeKey(bees, wish.role + '_');
            const code = spawn.spawnCreep(body, name, { memory: wish.extraMemory }); // TODO: 使用消耗顺序
            if (code === OK) {
                wish.bee.creep = Game.creeps[name];
                bees[name] = wish.bee;
                process.registerBee(wish.bee, wish.role);
                PriorityManager.arrangePriority(roomName);
            } else {
                log.error(`can't spawn creep! code: ${code} name: ${name} body: ${body}`);
            }
        }
    }

    public static clearDiedBees() {
        const processToResfresh: { [name: string]: Process } = {};
        const roomsToArrange: string[] = [];

        for (const beeName in bees) {
            const bee = bees[beeName];
            if (!bee) continue;
            if (!Game.creeps[beeName]) {
                // 为了防止在Bee意外死亡后重复生成
                if (bee.cyclingCallbackId) timer.cancelCallBack(bee.cyclingCallbackId);
                if (!bee.process.closed) {
                    bee.process.removeBee(beeName);
                    processToResfresh[bee.process.fullId] = bee.process;
                }
                if (!_.contains(roomsToArrange, bee.process.roomName)) roomsToArrange.push(bee.process.roomName);
                bees[beeName] = undefined as any;
                if (Memory.creeps[beeName]) Memory.creeps[beeName] = undefined as any;
            }
        }
        _.forEach(processToResfresh, process => process.wishCreeps());
        roomsToArrange.forEach(roomName => PriorityManager.arrangePriority(roomName));

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

    public static refreshBees() {
        for (const beeName in bees) {
            const bee = bees[beeName];
            if (!bee) continue;
            bee.creep = Game.creeps[beeName];
        }
    }

    public static wishBee(wish: BeeWish) {
        if (!this.wishes[wish.spawnRoom]) this.wishes[wish.spawnRoom] = {} as any;
        if (!this.wishes[wish.spawnRoom][wish.role]) this.wishes[wish.spawnRoom][wish.role] = [];
        this.wishes[wish.spawnRoom][wish.role].push(wish);
    }

    private static peekWish(roomName: string): BeeWish | undefined {
        const roleWishes = this.wishes[roomName];
        const wishes = _.min(roleWishes,
            (wishes, role) => wishes.length ? PriorityManager.getPriority(roomName, role! as any) : Infinity);
        return _.first(wishes);
    }

    private static dequeueWish(roomName: string): BeeWish | undefined {
        const roleWishes = this.wishes[roomName];
        const wishes = _.min(roleWishes,
            (wishes, role) => wishes.length ? PriorityManager.getPriority(roomName, role! as any) : Infinity);
        return wishes.shift();
    }

    private static wishCount(roomName: string) {
        return _.sum(this.wishes[roomName], wishes => wishes.length);
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
        // 将请求延后到下一tick来防止初始化未完成
        timer.callBackAtTick(timeAfterTick(1), () => process.wishCreeps());
    }
}

(global as any).BeeManager = BeeManager;