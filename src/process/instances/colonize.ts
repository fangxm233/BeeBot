import { BaseConstructor } from 'basePlanner/BaseConstructor';
import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { BeeBot } from 'BeeBot/BeeBot';
import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import {
    PROCESS_BASE_WORK,
    PROCESS_COLONIZE,
    PROCESS_DEFEND_INVADER_CORE,
    ROLE_CLAIMER,
    ROLE_PIONEER,
    ROLE_WORKER,
} from 'declarations/constantsExport';
import { ProcessBaseWork } from 'process/instances/baseWork';
import { ProcessDefendInvaderCore } from 'process/instances/defendInvaderCore';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';

const PIONEER_COUNT = 3;

@profile
export class ProcessColonize extends Process {
    public from: string;
    public claimed: boolean;

    constructor(roomName: string, from: string) {
        super(roomName, PROCESS_COLONIZE);
        this.wishManager = new WishManager(from, roomName, this);
        this.wishManager.setDefault('budget', Infinity);
        this.from = from;
    }

    public get memory(): protoProcessColonize {
        return super.memory as protoProcessColonize;
    }

    protected getProto(): any {
        return { from: this.from, claimed: this.claimed };
    }

    public static getInstance(proto: protoProcessColonize, roomName: string) {
        const process = new ProcessColonize(roomName, proto.from);
        process.claimed = proto.claimed;
        return process;
    }

    public setClaimed(claimed: boolean) {
        this.claimed = claimed;
        this.memory.claimed = claimed;
        if (claimed) {
            BaseConstructor.get(this.roomName).clearRoom();
            const result = RoomPlanner.planRoom(this.roomName, undefined);
            if (result.result) {
                BaseConstructor.get(this.roomName).constructBuildings();
            }
        }
    }

    public run() {
        if (this.claimed && !RoomPlanner.getRoomData(this.roomName)) {
            const result = RoomPlanner.planRoom(this.roomName, undefined);
            if (result.result) {
                BaseConstructor.get(this.roomName).constructBuildings();
            }
        }

        this.foreachBee(ROLE_PIONEER, bee => bee.run());
        this.foreachBee(ROLE_CLAIMER, bee => bee.run());

        const room = Game.rooms[this.roomName];
        if (!room) return;
        if (room.spawns.filter(spawn => spawn.my).length && room.controller!.my) {
            this.colonizeComplete();
        }
        if (room.invaderCore && !Process.getProcess
            < ProcessDefendInvaderCore > (this.from, PROCESS_DEFEND_INVADER_CORE, 'target', this.roomName)) {
            Process.startProcess(new ProcessDefendInvaderCore(this.from, this.roomName));
        }
    }

    public wishCreeps() {
        const count = this.getCreepAndWishCount(ROLE_PIONEER);
        if (count < PIONEER_COUNT) {
            this.wishManager.wishBee({
                count: PIONEER_COUNT - count,
                role: ROLE_PIONEER,
                setup: setups[ROLE_PIONEER].default,
            });
        }

        if (!this.getCreepAndWishCount(ROLE_CLAIMER) && !this.claimed) {
            this.wishManager.wishBee({
                role: ROLE_CLAIMER,
                setup: setups[ROLE_CLAIMER].default,
            });
        }
    }

    public colonizeComplete() {
        BeeBot.initializeColony(this.roomName);
        const baseWork = Process.getProcess<ProcessBaseWork>(this.roomName, PROCESS_BASE_WORK);
        if (baseWork) this.passBees(ROLE_PIONEER, ROLE_WORKER, baseWork);
        this.close();
    }
}