import { BeeSetup } from 'beeSpawning/BeeSetup';
import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { PERMANENT_UPGRADER } from 'config';
import { PROCESS_UPGRADE, ROLE_UPGRADER } from 'declarations/constantsExport';
import { event } from 'event/Event';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';

const START_UPGRADE_LINE = 3e5;
const UPGRADER_POW = 1.5;
const UPGRADER_BIAS = -3;
const MAX_UPGRADER = 10;

@profile
export class ProcessUpgrade extends Process {
    private setup: BeeSetup;
    private count: number;
    private inited: boolean;

    constructor(roomName: string) {
        super(roomName, PROCESS_UPGRADE);
        this.wishManager = new WishManager(roomName, roomName, this);
        this.wishManager.setDefault('role', ROLE_UPGRADER);
        this.wishManager.setDefault('budget', Infinity);

        event.addEventListener('onRclUpgrade', () => this.init());
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessUpgrade(roomName);
    }

    public run() {
        if (!this.inited && !this.init()) return;
        this.foreachBee(ROLE_UPGRADER, bee => bee.run());
    }

    private init(): boolean {
        if (!this.chooseSetup() || !this.judgeCount()) return false;
        return this.inited = true;
    }

    private chooseSetup(): boolean {
        const room = Game.rooms[this.roomName];
        if (!room) return false;
        const level = room.controller!.level;
        if (level < 4) return false;
        if (level == 8) this.setup = setups[ROLE_UPGRADER].final;
        else if (room.controller!.pos.findInRange(FIND_STRUCTURES, 2).filter(
            structure => structure.structureType == STRUCTURE_LINK).length) this.setup = setups[ROLE_UPGRADER].heavy;
        else this.setup = setups[ROLE_UPGRADER].default;

        return true;
    }

    private judgeCount(): boolean {
        const room = Game.rooms[this.roomName];
        if (!room) return false;
        const level = room.controller!.level;
        if (level < 4) return false;
        const storage = room.storage;

        if (level == 8) {
            if (PERMANENT_UPGRADER && storage && storage.store.energy >= START_UPGRADE_LINE) {
                this.count = 1;
                return true;
            }
            if (!PERMANENT_UPGRADER && room.controller!.ticksToDowngrade < 100e3) {
                this.count = 1;
                return true;
            }
            this.count = 0;
            return true;
        }

        if (!storage || storage.store.energy < START_UPGRADE_LINE) {
            this.count = 0;
            return true;
        }

        this.count = Math.min(Math.round(
            Math.pow(storage.store.energy / 1e5, UPGRADER_POW)) + UPGRADER_BIAS, MAX_UPGRADER);

        return true;
    }

    public wishCreeps() {
        if (!this.inited && !this.init()) return;
        this.judgeCount();

        const nowCount = this.getCreepAndWishCount(ROLE_UPGRADER);
        const config = { setup: this.setup, count: this.count - nowCount };
        if (nowCount < this.count) {
            this.wishManager.wishBee(config);
        }
    }
}