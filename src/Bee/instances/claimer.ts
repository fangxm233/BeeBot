import { Bee } from 'Bee/Bee';
import { ProcessColonize } from 'process/instances/colonize';
import { profile } from 'profiler/decorator';
import { Tasks } from 'tasks/Tasks';

@profile
export class BeeClaimer extends Bee {
    public process: ProcessColonize;

    protected runCore(): number | void {
        this.task?.isValid();

        if (!this.task) {
            if (this.room.name != this.process.roomName) {
                this.task = Tasks.goToRoom(this.process.roomName, { moveOptions: { preferHighway: true, allowSK: false, useFindRoute: true } });
            } else {
                const controller = this.room.controller!;
                if (!controller.my) {
                    if(controller.reservation) this.task = Tasks.attackController(controller);
                    else this.task = Tasks.claim(controller);
                }
                else {
                    this.process.setClaimed(true);
                    this.suicide();
                    return;
                }
            }
        }

        this.task.run();
    }
}