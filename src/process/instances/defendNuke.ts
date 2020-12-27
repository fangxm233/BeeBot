import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { PROCESS_BASE_WORK, PROCESS_DEFEND_NUKE, ROLE_WORKER } from 'declarations/constantsExport';
import { ProcessBaseWork } from 'process/instances/baseWork';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import { BaseConstructor } from 'basePlanner/BaseConstructor';

const WORKER_COUNT = 5;

@profile
export class ProcessDefendNuke extends Process {

    constructor(roomName: string) {
        super(roomName, PROCESS_DEFEND_NUKE);
        this.wishManager = new WishManager(roomName, roomName, this);
        this.wishManager.setDefault('budget', Infinity);
        this.wishManager.setDefault('setup', setups[ROLE_WORKER].default);
        this.wishManager.setDefault('role', ROLE_WORKER);
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessDefendNuke(roomName);
    }

    public run() {
        const room = Game.rooms[this.roomName];
        if (!room) {
            this.close();
            return;
        }

        const nukes = room.find(FIND_NUKES);
        if (!nukes.length) {
            const baseWork = Process.getProcess<ProcessBaseWork>(this.roomName, PROCESS_BASE_WORK);
            if (baseWork) this.passBees(ROLE_WORKER, ROLE_WORKER, baseWork);
            this.close();
        }

        if(Game.time % 10 == 0) BaseConstructor.get(this.roomName).constructNukeBarriers();

        this.foreachBee(ROLE_WORKER, bee => bee.run());
    }

    public wishCreeps() {
        const count = this.getCreepAndWishCount(ROLE_WORKER);
        if (this.getCreepAndWishCount(ROLE_WORKER) < WORKER_COUNT)
            this.wishManager.wishBee({ count: WORKER_COUNT - count });
    }
}