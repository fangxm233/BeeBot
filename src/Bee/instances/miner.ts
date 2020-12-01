import { BaseConstructor } from "basePlanner/BaseConstructor";
import { RoomPlanner } from "basePlanner/RoomPlanner";
import { structureLayout } from "basePlanner/structurePreset";
import { Bee } from "Bee/Bee";
import { ProcessMineSource } from "process/instances/mineSource";
import { profile } from "profiler/decorator";
import { coordToRoomPosition } from "utilities/helpers";

@profile
export class BeeMiner extends Bee {
    public process: ProcessMineSource;
    private harvestPos: RoomPosition;
    private mode: 'none' | 'container' | 'link';
    private sourceId: Id<Source>;
    private linkId: Id<StructureLink>;
    private centerId: Id<StructureLink>;
    private harvestPower: number;

    public get memory(): BeeMinerMemory {
        return this.creep.memory as BeeMinerMemory;
    }

    public runCore() {
        if (!this.harvestPos) {
            const data = RoomPlanner.getRoomData(this.process.target);
            if (!data) {
                const result = RoomPlanner.planRoom(this.process.roomName, this.process.target);
                return;
            }
            this.harvestPos = coordToRoomPosition(data.harvestPos.source[this.memory.s], this.process.target);
        }

        if (this.room.name != this.process.target) {
            this.travelToRoom(this.process.target);
            return;
        }

        if (!this.mode) this.judgeMode();
        if (!this.onPos()) return;
        if (!this.arriveTick) this.arriveTick = 1500 - this.ticksToLive;

        const source = Game.getObjectById(this.sourceId);
        if (source && source.energy) this.harvest(source);

        if (this.mode == 'link') {
            const link = Game.getObjectById(this.linkId);
            const center = Game.getObjectById(this.centerId);
            if (!link || !center) return;
            if (!this.harvestPower) this.harvestPower = this.bodyCounts[WORK] * HARVEST_POWER;

            if (this.creep.store.getFreeCapacity() <= this.harvestPower) this.transfer(link, RESOURCE_ENERGY);
            if (link.store.getFreeCapacity(RESOURCE_ENERGY) <= this.creep.store.energy) link.transferEnergy(center);
        }

    }

    private judgeMode() {
        if (!this.sourceId) this.sourceId = this.process.sources[this.memory.s].lookFor(LOOK_SOURCES)[0].id;

        this.mode = 'none';

        if (this.process.target == this.process.roomName) {
            const link = this.room.links.find(link => link.pos.inRangeTo(this.harvestPos, 1));
            if (link) {
                this.mode = 'link';
                this.linkId = link.id;

                this.centerId = BaseConstructor.get(this.room.name).
                    getForAtBase(STRUCTURE_LINK, structureLayout[8].buildings[STRUCTURE_LINK][0])?.id!;
            }
        }

        const container = this.harvestPos.lookForStructure(STRUCTURE_CONTAINER);
        if (container) {
            if (this.mode == 'link') container.destroy();
            else this.mode = 'container';
            return;
        }
    }

    private onPos(): boolean {
        if (this.mode == 'none') {
            const source = Game.getObjectById(this.sourceId);
            if (!source) return false;
            if (this.pos.isNearTo(source)) return true;
            this.travelTo(source);
        }
        else {
            if (this.pos.isEqualTo(this.harvestPos)) return true;
            this.travelTo(this.harvestPos);
        }

        return false;
    }
}