import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { Bee } from 'Bee/Bee';
import { profile } from 'profiler/decorator';
import { coordToRoomPosition } from 'utilities/helpers';

@profile
export class BeeDrone extends Bee {

    protected runCore(): number | void {
        const room = Game.rooms[this.process.roomName];
        if(!room) return;

        const mineral = room.find(FIND_MINERALS)[0];
        if (!mineral) return;
        if (!mineral.mineralAmount) return;

        const data = RoomPlanner.getRoomData(this.process.roomName);
        if (!data) return;
        const harvestPos = coordToRoomPosition(data.harvestPos.mineral!, this.process.roomName);

        if (!this.pos.isEqualTo(harvestPos)) {
            this.travelTo(harvestPos);
            return;
        }

        if(room.extractor?.cooldown) return;

        const container = this.pos.lookForStructure(STRUCTURE_CONTAINER);
        if (!container) return;
        if (!container.store.getFreeCapacity()) return;

        this.harvest(mineral);
    }
}