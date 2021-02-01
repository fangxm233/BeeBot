import { BeeManager } from 'beeSpawning/BeeManager';
import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { Intel } from 'dataManagement/Intel';
import { PROCESS_SEND_SCORE, ROLE_COLLECTOR_GUARD, ROLE_SEND_SCORE } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import { TerminalManager } from 'resourceManagement/TerminalManager';
import { partCount } from 'utilities/helpers';

@profile
export class ProcessSendScore extends Process {
    public target: string;
    public sources: string[];
    public count: number;
    private power: number;

    constructor(roomName: string, target: string) {
        super(roomName, PROCESS_SEND_SCORE);
        this.wishManager = new WishManager(roomName, target, this);
        this.wishManager.setDefault('budget', Infinity);
        this.wishManager.setDefault('role', ROLE_SEND_SCORE);
        this.wishManager.setDefault('setup', setups[ROLE_SEND_SCORE].default);
        this.target = target;
        this.sources = [];
    }

    public get memory(): protoProcessSendScore {
        return super.memory as protoProcessSendScore;
    }

    protected getProto(): any {
        return { target: this.target, sources: this.sources };
    }

    public static getInstance(proto: protoProcessSendScore, roomName: string) {
        const process = new ProcessSendScore(roomName, proto.target);
        process.sources = proto.sources;
        return process;
    }

    public addSource(roomName: string) {
        if (this.sources != this.memory.sources) this.memory.sources.push(roomName);
        this.sources.push(roomName);
    }

    public check(): boolean {
        const room = Game.rooms[this.target];
        if (room) {
            const collector = room.scoreCollector;
            if (!collector) return false;
            if (collector.store.getFreeCapacity(RESOURCE_SCORE) > 2000) {
                this.judgeCount();
                return true;
            }
        }
        if (Game.time % 50 != 0) return false;
        Intel.requestSight(this.target);
        return false;
    }

    public run() {
        this.foreachBee(ROLE_SEND_SCORE, bee => bee.run());
        this.foreachBee(ROLE_COLLECTOR_GUARD, bee => bee.run());

        this.sources.forEach(roomName => {
            const room = Game.rooms[roomName];
            if (!room?.storage) return;
            if (room.storage.store.getUsedCapacity(RESOURCE_SCORE)) {
                TerminalManager.setTransport(roomName, this.roomName, RESOURCE_SCORE, room.storage.store.score);
            }
        });

        const base = Game.rooms[this.roomName];
        const room = Game.rooms[this.target];
        const stored = base?.storage!.store.getUsedCapacity(RESOURCE_SCORE) || 0;
        const free = room?.scoreCollector?.store.getFreeCapacity(RESOURCE_SCORE) || Infinity;
        if (this.power && (stored < this.power || free < this.power) || this.count == 0) {
            if (!this.bees[ROLE_SEND_SCORE].find(bee => !!bee.store.getUsedCapacity())) {
                this.wait();
                return;
            }
        }
    }

    private judgeCount() {
        const room = Game.rooms[this.target];
        if (!room) {
            this.count = this.count || 0;
            return;
        }
        const base = Game.rooms[this.roomName];
        if (!base) return;

        const collector = room.scoreCollector;
        if (!collector) {
            this.count = 0;
            return;
        }
        if (!this.power) {
            const body = setups[ROLE_SEND_SCORE].default.generateCreepBody(BeeManager.getRoomEnergyCapacity(base));
            this.power = partCount(body, CARRY) * CARRY_CAPACITY;
        }
        this.count = Math.min(Math.floor(collector.store.getFreeCapacity(RESOURCE_SCORE) / this.power), 5);

        const stored = base.storage?.store.getUsedCapacity(RESOURCE_SCORE) || 0;
        this.count = Math.min(Math.floor(stored / this.power), this.count);
    }

    public wishCreeps() {
        this.judgeCount();
        this.wishManager.arrangeCyclingBees(ROLE_COLLECTOR_GUARD, setups[ROLE_COLLECTOR_GUARD].default, Infinity);
        if (!this.getCreepAndWishCount(ROLE_COLLECTOR_GUARD)) this.wishManager.wishBee(
            { role: ROLE_COLLECTOR_GUARD, setup: setups[ROLE_COLLECTOR_GUARD].default });
        const count = this.getCreepAndWishCount(ROLE_SEND_SCORE);
        if (count >= this.count) return;
        this.wishManager.wishBee({ count: this.count - count });
    }
}

(global as any).ProcessSendScore = ProcessSendScore;