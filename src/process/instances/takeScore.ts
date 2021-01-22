import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { PROCESS_TAKE_SCORE, ROLE_TAKE_SCORE } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import { USER_NAME } from 'config';

@profile
export class ProcessTakeScore extends Process {
    public target: string;

    constructor(roomName: string, target: string) {
        super(roomName, PROCESS_TAKE_SCORE);
        this.wishManager = new WishManager(roomName, target, this);
        this.wishManager.setDefault('budget', Infinity);
        this.wishManager.setDefault('role', ROLE_TAKE_SCORE);
        this.wishManager.setDefault('setup', setups[ROLE_TAKE_SCORE].default);
        this.target = target;
    }

    public get memory(): protoProcessTakeScore {
        return super.memory as protoProcessTakeScore;
    }

    protected getProto(): any {
        return { target: this.target };
    }

    public static getInstance(proto: protoProcessTakeScore, roomName: string) {
        return new ProcessTakeScore(roomName, proto.target);
    }

    public run() {
        if (this.target && this.target != 'none') this.foreachBee(ROLE_TAKE_SCORE, bee => bee.run());

        const room = Game.rooms[this.target];
        if (room && !room.scoreContainers.length || this.target == 'none') {
            if (!this.bees[ROLE_TAKE_SCORE].find(bee => !!bee.store.getUsedCapacity())) {
                this.target = 'none';
                this.memory.target = 'none';
            }
            if (!this.getCreepAndWishCount(ROLE_TAKE_SCORE)) this.close();
        }
        if (room?.controller?.owner && room.controller.owner?.username != USER_NAME) {
            this.target = 'none';
            this.memory.target = 'none';
        }
    }

    public wishCreeps() {
        if (!this.target || this.target == 'none') return;
        const room = Game.rooms[this.target];
        if (room && !room.scoreContainers.length) return;

        const base = Game.rooms[this.roomName];
        if (!base) return;
        if ((base.storage?.store.getUsedCapacity(RESOURCE_ENERGY) || 0) < 50e3) return;
        if (this.getCreepAndWishCount(ROLE_TAKE_SCORE) < 5) {
            this.wishManager.wishBee({ count: 5 - this.getCreepAndWishCount(ROLE_TAKE_SCORE) });
        }
    }
}