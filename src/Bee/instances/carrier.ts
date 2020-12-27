import { Bee } from 'Bee/Bee';
import { ProcessCarry } from 'process/instances/carry';
import { profile } from 'profiler/decorator';
import { Tasks } from 'tasks/Tasks';

@profile
export class BeeCarrier extends Bee {
    public process: ProcessCarry;
    private targetPos: RoomPosition;
    private resourceType: ResourceConstant;

    public get memory(): BeeCarrierMemory {
        return this.creep.memory as BeeCarrierMemory;
    }

    public runCore() {
        if (!this.targetPos)
            this.targetPos = new RoomPosition(this.memory.pos.x, this.memory.pos.y, this.memory.pos.roomName);
        if (!this.resourceType) this.resourceType = this.memory.type;
        if (!this.targetPos) {
            this.suicide();
            return;
        }

        this.task?.isValid();
        if (!this.task) {
            if (this.room.name != this.targetPos.roomName) {
                this.task = Tasks.goToRoom(this.targetPos.roomName);
            } else if (!this.store.getFreeCapacity()) {
                const storage = Game.rooms[this.process.roomName]?.storage;
                if (storage) this.task = Tasks.transfer(storage, this.resourceType);
            } else if (!this.pos.isNearTo(this.targetPos)) {
                this.task = Tasks.goTo(this.targetPos);
            } else {
                const drop = this.targetPos.findInRange(FIND_DROPPED_RESOURCES, 4).filter(resource =>
                    resource.resourceType == this.resourceType && resource.amount >= this.store.getFreeCapacity())[0];
                if (drop) {
                    if (!this.pos.isNearTo(drop)) this.task = Tasks.goTo(drop);
                    else this.pickup(drop);
                } else {
                    const container = this.targetPos.lookForStructure(STRUCTURE_CONTAINER);
                    if (container && container.store[this.resourceType] >= this.store.getFreeCapacity()) {
                        this.withdraw(container, this.resourceType);
                    }
                }
            }
        }

        this.task?.run();
    }
}