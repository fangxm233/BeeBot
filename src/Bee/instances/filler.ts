import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";
import { ResourcesManager } from "resourceManagement/ResourcesManager";
import { Tasks } from "tasks/Tasks";

@profile
export class BeeFiller extends Bee {

    public runCore() {
        this.task?.isValid();
        if (!this.task) {
            if (!this.store.energy) {
                this.task = ResourcesManager.getEnergySource(this);
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