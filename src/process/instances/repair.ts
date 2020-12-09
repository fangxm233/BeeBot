import { BarrierPlanner } from 'basePlanner/BarrierPlanner';
import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { PROCESS_REPAIR, ROLE_WORKER } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { timeAfterTick } from 'utilities/helpers';

export class ProcessRepair extends Process {
    constructor(roomName: string) {
        super(roomName, PROCESS_REPAIR);
        this.wishManager = new WishManager(roomName, roomName, this);
        this.wishManager.setDefault('role', ROLE_WORKER);
        this.wishManager.setDefault('budget', Infinity);
        this.wishManager.setDefault('setup', setups[ROLE_WORKER].default);
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessRepair(roomName);
    }

    public run() {
        this.foreachBee(ROLE_WORKER, bee => bee.run());
    }

    public wishCreeps() {
        if (this.getCreepAndWishCount(ROLE_WORKER)) return;
        const room = Game.rooms[this.roomName];
        if (!room) return;

        const planner = BarrierPlanner.get(this.roomName);
        const ramparts = room.ramparts.filter(rampart => rampart.hits < planner.getBarrierHitsTarget(rampart.pos));
        if (!ramparts.length) {
            this.sleep(timeAfterTick(100));
            return;
        }

        this.wishManager.wishBee({});
    }
}