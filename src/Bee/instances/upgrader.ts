import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";
import { ResourcesManager } from "resourceManagement/ResourcesManager";
import { Tasks } from "tasks/Tasks";

@profile
export class BeeUpgrader extends Bee {

    public runCore() {
        this.task?.isValid();
        if (!this.task) {
            if (!this.store.energy) {
                this.task = ResourcesManager.getEnergySource(this, false);
            } else {
                const spawnRoom = Game.rooms[this.process.roomName];
                if (!spawnRoom) return;
                this.task = Tasks.upgrade(spawnRoom.controller!);
            }
        }
        this.task?.run();
    }
}