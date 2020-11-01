import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";
import { Tasks } from "tasks/Tasks";

@profile
export class BeeFiller extends Bee {

    public runCore() {
        this.task?.isValid();
        if (!this.task) {
            if (!this.store.energy) {
                const energy = _.max(this.room.droppedEnergy, energy => energy.amount);
                if (energy) {
                    this.task = Tasks.pickup(energy);
                }
            } else {
                if (!this.pos.isNearTo(this.room.spawns[0])) {
                    this.travelTo(this.room.spawns[0]);
                    return;
                }
                if (this.room.spawns[0].store.getFreeCapacity(RESOURCE_ENERGY))
                    this.transfer(this.room.spawns[0], RESOURCE_ENERGY);
            }
        } else this.task.run();
    }
}