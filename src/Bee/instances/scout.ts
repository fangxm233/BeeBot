import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";
import { Tasks } from "tasks/Tasks";

@profile
export class BeeScout extends Bee {

    public get memory(): BeeScoutMemory {
        return this.creep.memory as BeeScoutMemory;
    }

    public get target() {
        return this.memory.t;
    }
    public set target(room: string | undefined) {
        this.memory.t = room;
    }

    public arrangeTarget(roomName: string) {
        this.target = roomName;
        this.unlock();
    }

    public runCore() {
        this.task?.isValid();
        if (!this.task && this.target) {
            this.task = Tasks.goToRoom(this.target);
        } else this.lock();

        this.task?.run();
    }
}