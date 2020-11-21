import { Bee } from "Bee/Bee";
import { log } from "console/log";
import { ProcessFilling } from "process/instances/filling";
import { profile } from "profiler/decorator";
import { ResourcesManager } from "resourceManagement/ResourcesManager";
import { Tasks } from "tasks/Tasks";

@profile
export class BeeFiller extends Bee {
    public process: ProcessFilling;

    public runCore() {
        this.task?.isValid();
        if (!this.task) {
            if (!this.store.energy) {
                this.task = ResourcesManager.getEnergySource(this, 0);
                this.process.energyEnough = !!this.task;
            } else {
                const targets: (StructureSpawn | StructureExtension)[] = [...this.room.spawns];
                targets.push(...this.room.extensions);
                const target = this.pos.findClosestByRange(targets.filter(t => !!t.store.getFreeCapacity(RESOURCE_ENERGY)));
                if (!target) return;
                this.task = Tasks.transfer(target, RESOURCE_ENERGY);
            }
        } else this.task.run();
    }
}