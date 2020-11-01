import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";
import { Tasks } from "tasks/Tasks";

@profile
export class BeeUpgrader extends Bee {

    public runCore() {
        this.task?.isValid();
        if (!this.task) {
            if (!this.store.energy) {
                const energy = _.max(this.room.droppedEnergy, energy => energy.amount);
                if (energy) {
                    this.task = Tasks.pickup(energy);
                }
            } else {
                this.task = Tasks.upgrade(this.room.controller!);
            }
        } else this.task.run();
    }
}