import { BeeManager } from 'beeSpawning/BeeManager';
import { BeeSetup } from 'beeSpawning/BeeSetup';
import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { Intel } from 'dataManagement/Intel';
import { PROCESS_RESERVING, ROLE_RESERVER } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import { partCount, timeAfterTick } from 'utilities/helpers';

const DEFAULT_TICKS_TO_ARRIVE = 20;
const AWAKE_AT_REMAINING = 1000;

@profile
export class ProcessReserving extends Process {
    public ticksToArrive: number;
    public target: string;
    private setup: BeeSetup;
    private maxCount: number;
    private count: number;
    private ticksToEnd: number;
    private inited: boolean;

    constructor(roomName: string, target: string) {
        super(roomName, PROCESS_RESERVING);
        this.wishManager = new WishManager(roomName, target, this);
        this.wishManager.setDefault('role', ROLE_RESERVER);
        this.wishManager.setDefault('budget', Infinity);
        this.wishManager.setDefault('setup', setups[ROLE_RESERVER].default);

        this.target = target;
        this.setup = setups[ROLE_RESERVER].default;
    }

    public get memory(): protoProcessReserving {
        return super.memory as protoProcessReserving;
    }

    public static getInstance(proto: protoProcessReserving, roomName: string) {
        return new ProcessReserving(roomName, proto.target);
    }

    public getProto() {
        return { target: this.target };
    }

    public init(): boolean {
        const room = Game.rooms[this.target];
        if (!room) {
            Intel.requestRoomIntel(this.target);
            return false;
        }

        this.maxCount = room.controller!.pos.availableNeighbors(true, false).length;
        return this.inited = this.calReserverCount(room.controller!.reservation?.ticksToEnd || 0);
    }

    public run() {
        if (!this.inited && !this.init()) return;

        const room = Game.rooms[this.target];
        if (room) this.ticksToEnd = room.controller!.reservation?.ticksToEnd || 0;

        this.foreachBee(ROLE_RESERVER, bee => bee.run());

        if (!this.count && !this.bees[ROLE_RESERVER].length)
            this.sleep(timeAfterTick(this.ticksToEnd - AWAKE_AT_REMAINING));
    }

    public wishCreeps() {
        this.wishManager.clear();
        this.calReserverCount(this.ticksToEnd || 0);

        const nowCount = this.getCreepAndWishCount(ROLE_RESERVER);
        if (nowCount < this.count) {
            this.wishManager.wishBee({ count: this.count - nowCount });
        }
    }

    private calReserverCount(ticksToEnd: number): boolean {
        const room = Game.rooms[this.roomName];
        if (!room) return false;
        const body = this.setup.generateCreepBody(BeeManager.getRoomEnergyCapacity(room));
        const power = partCount(body, CLAIM);
        const restOfLife = (CREEP_CLAIM_LIFE_TIME - (this.ticksToArrive || DEFAULT_TICKS_TO_ARRIVE));
        const lifePower = restOfLife * power;
        this.count = Math.floor((CONTROLLER_RESERVE_MAX - ticksToEnd + restOfLife) / lifePower);
        this.count = Math.min(this.maxCount, this.count);
        return true;
    }
}

(global as any).ProcessReserving = ProcessReserving;