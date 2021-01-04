import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { PROCESS_DEFEND_INVADER_CORE, ROLE_DE_INVADER_CORE } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';

@profile
export class ProcessDefendInvaderCore extends Process {
    public target: string;
    public complete: boolean;

    constructor(roomName: string, target: string) {
        super(roomName, PROCESS_DEFEND_INVADER_CORE);
        this.target = target;
        this.wishManager = new WishManager(roomName, target, this);
        this.wishManager.setDefault('role', ROLE_DE_INVADER_CORE);
        this.wishManager.setDefault('budget', Infinity);
        this.wishManager.setDefault('setup', setups[ROLE_DE_INVADER_CORE].default);
    }

    public get memory(): protoProcessDefendInvaderCore {
        return super.memory as protoProcessDefendInvaderCore;
    }

    public static getInstance(proto: protoProcessDefendInvaderCore, roomName: string) {
        return new ProcessDefendInvaderCore(roomName, proto.target);
    }

    protected getProto(): any {
        return { target: this.target };
    }

    public run() {
        this.foreachBee(ROLE_DE_INVADER_CORE, bee => bee.run());

        if(this.complete) this.close();
    }

    public wishCreeps() {
        if (!this.getCreepAndWishCount(ROLE_DE_INVADER_CORE)) this.wishManager.wishBee({});
    }
}