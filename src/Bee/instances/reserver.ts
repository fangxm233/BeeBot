import { Bee } from 'Bee/Bee';
import { ProcessReserving } from 'process/instances/reserving';
import { profile } from 'profiler/decorator';
import { Tasks } from 'tasks/Tasks';

@profile
export class BeeReserver extends Bee {
    public process: ProcessReserving;

    public runCore() {
        this.task?.isValid();

        if (!this.task) {
            if (this.room.name != this.process.target) {
                this.task = Tasks.goToRoom(this.process.target);
            } else {
                this.task = Tasks.reserve(this.room.controller!);
            }
        }

        if (this.pos.isNearTo(this.room.controller!) && !this.arriveTick) {
            this.arriveTick = 600 - this.ticksToLive;
            this.process.ticksToArrive = this.arriveTick;
        }

        this.task.run();
    }
}