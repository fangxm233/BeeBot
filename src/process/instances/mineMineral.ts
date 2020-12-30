import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { Intel } from 'dataManagement/Intel';
import { PROCESS_MINE_MINERAL, ROLE_CARRIER, ROLE_DRONE } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import { coordToRoomPosition, timeAfterTick } from 'utilities/helpers';

@profile
export class ProcessMineMineral extends Process { // TODO: 将运输分离出来
    constructor(roomName: string) {
        super(roomName, PROCESS_MINE_MINERAL);
        this.wishManager = new WishManager(roomName, roomName, this);
        this.wishManager.setDefault('budget', Infinity);
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessMineMineral(roomName);
    }

    public run() {
        const room = Game.rooms[this.roomName];
        if (!room) {
            this.close();
            return;
        }

        const mineral = room.find(FIND_MINERALS)[0];
        if (!mineral) {
            this.close();
            return;
        }

        if (mineral.ticksToRegeneration > 150) {
            this.sleep(timeAfterTick(mineral.ticksToRegeneration - 150));
            return;
        }

        this.foreachBee(ROLE_DRONE, bee => bee.run());
        this.foreachBee(ROLE_CARRIER, bee => bee.run());
    }

    public wishCreeps() {
        const data = RoomPlanner.getRoomData(this.roomName);
        const intel = Intel.getRoomIntel(this.roomName);
        if (!data || !intel) return;
        const pos = coordToRoomPosition(data.harvestPos.mineral!, this.roomName);

        if (!this.getCreepAndWishCount(ROLE_DRONE))
            this.wishManager.wishBee({ role: ROLE_DRONE, setup: setups[ROLE_DRONE].default });
        if (!this.getCreepAndWishCount(ROLE_CARRIER))
            this.wishManager.wishBee({
                role: ROLE_CARRIER, setup: setups[ROLE_CARRIER].default,
                extraMemory: { pos, type: intel.mineralType! },
            });
    }
}