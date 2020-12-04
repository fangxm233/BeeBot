import { Bee } from "Bee/Bee";
import { ProcessCarry } from "process/instances/carry";
import { profile } from "profiler/decorator";
import { Tasks } from "tasks/Tasks";

@profile
export class BeeCarrier extends Bee {
    public process: ProcessCarry;
    private targetPos: RoomPosition;

    public get memory(): BeeCarrierMemory {
        return this.creep.memory as BeeCarrierMemory;
    }

    public runCore() {
        if (!this.targetPos) this.targetPos = this.process.poses[this.memory.i];

        this.task?.isValid();
        if (!this.task) {
            if (this.room.name != this.process.target) {
                this.task = Tasks.goToRoom(this.process.target);
            } else if (!this.store.getFreeCapacity()) {
                const storage = Game.rooms[this.process.roomName]?.storage;
                if (storage) this.task = Tasks.transfer(storage, RESOURCE_ENERGY);
            } else if (!this.pos.isNearTo(this.targetPos)) {
                this.task = Tasks.goTo(this.targetPos);
            } else {
                const drop = this.targetPos.findInRange(FIND_DROPPED_RESOURCES, 4).filter(resource =>
                    resource.resourceType == RESOURCE_ENERGY && resource.amount >= this.store.getFreeCapacity())[0];
                if (drop) {
                    if (!this.pos.isNearTo(drop)) this.task = Tasks.goTo(drop);
                    else this.pickup(drop);
                }
                else {
                    const container = this.targetPos.lookForStructure(STRUCTURE_CONTAINER);
                    if (container && container.store.energy >= this.store.getFreeCapacity()) {
                        this.withdraw(container, RESOURCE_ENERGY);
                    }
                }
            }
        }

        this.task?.run();
    }
}