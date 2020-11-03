import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";
import { ResourcesManager } from "resourceManagement/ResourcesManager";
import { transferTargetType } from "tasks/instances/task_transfer";
import { Task } from "tasks/Task";
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
                const target = targets.filter(t => !!t.store.getFreeCapacity(RESOURCE_ENERGY))[0];
                if (!target) return;
                if (!this.pos.isNearTo(target)) {
                    this.travelTo(target);
                    return;
                }
                this.transfer(target, RESOURCE_ENERGY);
            }
        } else this.task.run();
    }
}