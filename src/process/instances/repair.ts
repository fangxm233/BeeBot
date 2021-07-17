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
        const repairAmount = _.sum(room.ramparts,
                rampart => Math.max(0, planner.getBarrierHitsTarget(rampart.pos) - rampart.hits));

        const bodies = setups[ROLE_WORKER].default.generateCreepBody(room.energyCapacityAvailable);

        let workerNum = repairAmount / 100 / (bodies.length / 3) / CREEP_LIFE_TIME;
        if(workerNum > 1) workerNum = Math.min(3, Math.floor(workerNum));
        else workerNum = Math.floor(workerNum + 0.1);

        if (!workerNum) {
            this.sleep(timeAfterTick(100));
            return;
        }

        this.wishManager.wishBee({count: workerNum});
    }
}