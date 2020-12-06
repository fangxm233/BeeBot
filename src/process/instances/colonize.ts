import { BaseConstructor } from 'basePlanner/BaseConstructor';
import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { bees } from 'Bee/Bee';
import { BeeFactorty } from 'Bee/BeeFactory';
import { BeeBot } from 'BeeBot/BeeBot';
import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import {
    PROCESS_BASE_WORK,
    PROCESS_COLONIZE,
    ROLE_CLAIMER,
    ROLE_PIONEER,
    ROLE_WORKER,
} from 'declarations/constantsExport';
import { ProcessBaseWork } from 'process/instances/baseWork';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';

const PIONEER_COUNT = 3;

@profile
export class ProcessColonize extends Process {
    public memory: protoProcessColonize;
    public from: string;
    public claimed: boolean;

    constructor(roomName: string, from: string) {
        super(roomName, PROCESS_COLONIZE);
        this.wishManager = new WishManager(from, roomName, this);
        this.wishManager.setDefault('budget', Infinity);
        this.from = from;
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
        if (room.spawns.filter(spawn => spawn.my).length) {
            this.spawnCompleted();
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

    public spawnCompleted() {
        BeeBot.initializeColony(this.roomName);
        const baseWork = Process.getProcess<ProcessBaseWork>(this.roomName, PROCESS_BASE_WORK);
        if (baseWork) this.foreachBee(ROLE_PIONEER, bee => {
            this.removeBee(bee.name);
            bees[bee.name] = BeeFactorty.getInstance(ROLE_WORKER, baseWork, bee.name);
            baseWork.registerBee(bees[bee.name], ROLE_WORKER);
        });
        this.close();
    }
}