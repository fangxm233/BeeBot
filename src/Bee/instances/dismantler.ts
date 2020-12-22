import { Bee } from 'Bee/Bee';
import { ProcessDismantle } from 'process/instances/dismantle';
import { profile } from 'profiler/decorator';
import { Tasks } from 'tasks/Tasks';

@profile
export class BeeDismantler extends Bee {
    public process: ProcessDismantle;

    protected runCore(): number | void {
        this.task?.isValid();

        if (!this.task) {
            if (this.room.name != this.process.target) {
                this.task = Tasks.goToRoom(this.process.target);
            } else {
                const flag = _.min(this.room.find(FIND_FLAGS)
                        .filter(flag => flag.name.match('d_')?.length)
                        .filter(flag => flag.pos.lookFor(LOOK_STRUCTURES).length),
                    flag => flag.name.split('_')[1]);
                if(flag as any != Infinity) {
                    if(!this.pos.isNearTo(flag)) this.task = Tasks.goTo(flag);
                    else {
                        const structure = flag.pos.lookFor(LOOK_STRUCTURES)[0];
                        this.task = Tasks.dismantle(structure);
                    }
                }
            }
        }

        this.task?.run();
    }
}