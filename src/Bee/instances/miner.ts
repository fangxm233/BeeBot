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
    private containerId: Id<StructureContainer>;
    private centerId: Id<StructureLink>;
    private workCount: number;

    public get memory(): BeeMinerMemory {
        return this.creep.memory as BeeMinerMemory;
    }

    public runCore() {
        if (!this.harvestPos) {
            const data = RoomPlanner.getRoomData(this.process.target);
            if (!this.process.earlyOutpost && !data) RoomPlanner.planRoom(this.process.roomName, this.process.target);
            if (data) this.harvestPos = coordToRoomPosition(data.harvestPos.source[this.memory.s], this.process.target);
        }

        if (this.room.name != this.process.target) {
            if (this.process.roomName != this.process.target) {
                if (!this.store.energy && this.room.storage && this.room.storage.store.energy) {
                    if (!this.pos.isNearTo(this.room.storage)) this.travelTo(this.room.storage);
                    else this.withdraw(this.room.storage, RESOURCE_ENERGY);
                    return;
                }
            }
            this.travelToRoom(this.process.target);
            return;
        }

        if (!this.mode) this.judgeMode();
        if (!this.workCount) this.workCount = this.bodyCounts[WORK];
        if (!this.onPos()) return;
        if (!this.arriveTick) this.arriveTick = 1500 - this.ticksToLive;

        switch (this.mode) {
            case 'none':
                this.runNone();
                break;
            case 'container':
                this.runContainer();
                break;
            case 'link':
                this.runLink();
                break;
            default:
                break;
        }
    }

    private judgeMode() {
        if (!this.sourceId) this.sourceId = this.process.sources[this.memory.s].lookFor(LOOK_SOURCES)[0].id;

        this.mode = 'none';
        if (!this.harvestPos) return;

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
            this.containerId = container.id;
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

        if (this.store.energy) {
            const road = this.pos.findInRange(FIND_STRUCTURES, 3).filter(
                structure => structure.structureType == STRUCTURE_ROAD
                    && structure.hits < structure.hitsMax - this.workCount * REPAIR_POWER)[0];
            if (road) this.repair(road);
        }

        return false;
    }

    private runNone() {
        if (this.store.energy >= this.workCount * BUILD_POWER || !this.store.getFreeCapacity()) {
            const site = this.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3)[0];
            if (site) {
                this.build(site);
                return;
            }
        }

        const source = Game.getObjectById(this.sourceId);
        if (source && source.energy) this.harvest(source);
    }

    private runContainer() {
        const container = Game.getObjectById(this.containerId);
        if (container) {
            if (this.store.getFreeCapacity() > 0 && container.store.energy >= this.store.getCapacity()) {
                this.withdraw(container, RESOURCE_ENERGY);
            }

            if (container.hitsMax - container.hits >= this.workCount * REPAIR_POWER
                && this.store.getUsedCapacity() > this.workCount) {
                this.repair(container);
                return;
            }

            if (!container.store.getFreeCapacity()) return;
        } else this.mode = 'none';

        const source = Game.getObjectById(this.sourceId);
        if (source && source.energy) this.harvest(source);
    }

    private runLink() {
        const source = Game.getObjectById(this.sourceId);
        if (source && source.energy) this.harvest(source);

        if (this.mode == 'link') {
            const link = Game.getObjectById(this.linkId);
            const center = Game.getObjectById(this.centerId);
            if (!link || !center) return;

            if (this.store.getFreeCapacity() <= this.workCount * HARVEST_POWER) this.transfer(link, RESOURCE_ENERGY);
            if (link.store.getFreeCapacity(RESOURCE_ENERGY) <= this.store.energy) link.transferEnergy(center);
        }
    }
}