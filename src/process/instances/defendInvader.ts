import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { PROCESS_DEFEND_INVADER, ROLE_DE_INVADER } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';

@profile
export class ProcessDefendInvader extends Process {
    public target: string;
    public complete: boolean;

    constructor(roomName: string, target: string) {
        super(roomName, PROCESS_DEFEND_INVADER);
        this.target = target;
        this.wishManager = new WishManager(roomName, target, this);
        this.wishManager.setDefault('role', ROLE_DE_INVADER);
        this.wishManager.setDefault('budget', Infinity);
        this.wishManager.setDefault('setup', setups[ROLE_DE_INVADER].default);
    }

    public get memory(): protoProcessDefendInvader {
        return super.memory as protoProcessDefendInvader;
    }

    public static getInstance(proto: protoProcessDefendInvader, roomName: string) {
        return new ProcessDefendInvader(roomName, proto.target);
    }

    protected getProto(): any {
        return { target: this.target };
    }

    public run() {
        this.foreachBee(ROLE_DE_INVADER, bee => bee.run());

        if(this.complete) this.close();
    }

    public wishCreeps() {
        if (!this.getCreepAndWishCount(ROLE_DE_INVADER)) this.wishManager.wishBee({});
    }
}