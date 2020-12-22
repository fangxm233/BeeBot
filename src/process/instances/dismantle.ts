import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { PROCESS_DISMANTLE, ROLE_DISMANTLER } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';

@profile
export class ProcessDismantle extends Process {
    public memory: protoProcessDismantle;
    public target: string;

    constructor(roomName: string, target: string) {
        super(roomName, PROCESS_DISMANTLE);
        this.target = target;
        this.wishManager = new WishManager(roomName, target, this);
        this.wishManager.setDefault('role', ROLE_DISMANTLER);
        this.wishManager.setDefault('budget', Infinity);
        this.wishManager.setDefault('setup', setups[ROLE_DISMANTLER].default);
    }

    public static getInstance(proto: protoProcessDismantle, roomName: string) {
        return new ProcessDismantle(roomName, proto.target);
    }

    protected getProto() {
        return { target: this.target };
    }

    public run() {
        this.foreachBee(ROLE_DISMANTLER, bee => bee.run());

        if(!Game.flags[`dismantle_${this.roomName}`]) this.close();
    }

    public wishCreeps() {
        if (!this.getCreepAndWishCount(ROLE_DISMANTLER))
            this.wishManager.wishBee({});
    }
}