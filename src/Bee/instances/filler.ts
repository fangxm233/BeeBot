import { RoomPlanner } from "basePlanner/RoomPlanner";
import { Bee } from "Bee/Bee";
import { event } from "event/Event";
import { ProcessFilling } from "process/instances/filling";
import { profile } from "profiler/decorator";
import { ResourcesManager } from "resourceManagement/ResourcesManager";

type fillingTargetType = StructureSpawn | StructureTower | StructureExtension;

@profile
export class BeeFiller extends Bee {
    public process: ProcessFilling;
    private fillingRoute: RoomPosition[];
    private targetList: { [index: number]: Id<fillingTargetType>[] };
    private containerId: Id<StructureContainer>;
    private index: number = -1;
    private finished: boolean;

    public get memory(): BeeFillerMemory {
        return this.creep.memory as BeeFillerMemory;
    }

    public runCore() {
        if (!this.arriveTick) this.arriveTick = 1;
        if (!this.memory.i) this.memory.i = 0;
        if (!this.fillingRoute) {
            const data = RoomPlanner.getRoomData(this.room.name);
            if (data) this.fillingRoute = RoomPlanner.getFillingRoute(data.basePos!, this.room.name, this.memory.i);
            else return;
        }
        if (!this.targetList) {
            this.genList();
            event.addEventListener('onBuildComplete', () => this.genList());
        }

        if (!this.store.energy) {
            if (!this.task) this.task =
                ResourcesManager.getEnergySource(this, !this.finished, this.process.energyEnough ? undefined : 1);
            this.task?.isValid();
            this.process.energyEnough = !!this.task;
            this.task?.run();
            return;
        }

        const findTargets = (index: number) => {
            if (index == -1) return [];
            const ids = this.targetList[index];
            return ids.map(id => Game.getObjectById(id)!).filter(structure => {
                if (!structure) return false;
                if (structure instanceof StructureTower) return structure.store.getFreeCapacity(RESOURCE_ENERGY) > 400;
                return !!structure.store.getFreeCapacity(RESOURCE_ENERGY);
            });
        }

        const findIndex = (from: number, to: number): number => {
            if (from == -1) from = 0;
            for (let i = from; i < to; i++) {
                const structures = findTargets(i);
                if (!structures.length) continue;
                return i;
            }
            return -1;
        }

        const targets = findTargets(this.index);

        if (targets.length == 0) {
            this.index = findIndex(this.index, this.fillingRoute.length);
            if (this.index == -1) this.index = findIndex(0, this.index);
        }

        if (this.index != -1) {
            this.finished = false;
            if (this.pos.isEqualTo(this.fillingRoute[this.index])) {
                this.transfer(targets[0], RESOURCE_ENERGY);
                if (targets.length == 1 && targets[0].store.getFreeCapacity(RESOURCE_ENERGY) < this.store.energy) {
                    this.index = this.nextIndex(this.index);
                    this.travelTo(this.fillingRoute[this.index]);
                }
            }
            else this.travelTo(this.fillingRoute[this.index]);
        } else {
            this.finished = true;
            if (!this.containerId) {
                const container = RoomPlanner.getFillerContainer(this.room.name, this.memory.i);
                if (container) this.containerId = container.id;
            }

            if (this.containerId) {
                const container = Game.getObjectById(this.containerId);
                if (container && container.store.getFreeCapacity() > container.store.getCapacity() / 2) {
                    if (!this.pos.isNearTo(container)) {
                        this.travelTo(container);
                        return;
                    } else {
                        this.transfer(container, RESOURCE_ENERGY);
                        return;
                    }
                }
            }

            if (this.pos.isEqualTo(this.fillingRoute[0])) this.lock();
            else this.travelTo(this.fillingRoute[0]);
        }
    }

    private nextIndex(index: number): number {
        if (this.index >= this.fillingRoute.length - 1) return 0;
        else return this.index + 1;
    }

    private genList() {
        this.targetList = {};
        this.fillingRoute.forEach((pos, i) => {
            this.targetList[i] = _.compact(pos.neighbors.map(pos => pos.lookFor(LOOK_STRUCTURES).filter(
                s => s.structureType == STRUCTURE_SPAWN
                    || s.structureType == STRUCTURE_TOWER
                    || s.structureType == STRUCTURE_EXTENSION)[0]?.id)) as Id<fillingTargetType>[];
        });
    }
}