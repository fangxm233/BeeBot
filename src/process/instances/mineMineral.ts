import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import { PROCESS_MINE_MINERAL, ROLE_DRONE } from 'declarations/constantsExport';
import { WishManager } from 'beeSpawning/WishManager';
import { setups } from 'beeSpawning/setups';
import { timeAfterTick } from 'utilities/helpers';

@profile
export class ProcessMineMineral extends Process {
    constructor(roomName: string) {
        super(roomName, PROCESS_MINE_MINERAL);
        this.wishManager = new WishManager(roomName, roomName, this);
        this.wishManager.setDefault('budget', Infinity);
        this.wishManager.setDefault('role', ROLE_DRONE);
        this.wishManager.setDefault('setup', setups[ROLE_DRONE].default);
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessMineMineral(roomName);
    }

    public run() {
        const room = Game.rooms[this.roomName];
        if(!room) {
            this.close();
            return;
        }

        const mineral = room.find(FIND_MINERALS)[0];
        if(!mineral) {
            this.close();
            return;
        }

        if(!mineral.mineralAmount) {
            this.sleep(timeAfterTick(mineral.ticksToRegeneration - 150));
            return;
        }

        this.foreachBee(ROLE_DRONE, bee => bee.run());
    }

    public wishCreeps() {
        if(!this.getCreepAndWishCount(ROLE_DRONE)) this.wishManager.wishBee({});
    }
}