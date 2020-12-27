import { Bee } from 'Bee/Bee';
import { ProcessColonize } from 'process/instances/colonize';
import { profile } from 'profiler/decorator';
import { ResourcesManager } from 'resourceManagement/ResourcesManager';
import { Tasks } from 'tasks/Tasks';

@profile
export class BeePioneer extends Bee {
    public process: ProcessColonize;

    protected runCore(): number | void {
        this.task?.isValid();

        if (!this.task) {
            if (this.room.name == this.process.from && !this.store.energy) {
                this.task = ResourcesManager.getEnergySource(this, false);
            } else if (this.room.name != this.process.roomName) {
                this.task = Tasks.goToRoom(this.process.roomName, { moveOptions: { preferHighway: true } });
            } else {
                const controller = this.room.controller!;
                if (!controller.my) return;
                if (!this.store.energy) {
                    const source = this.pos.findClosestByPath(this.room.sources.filter(source =>
                        source.targetedBy.length < source.pos.availableNeighbors(true, false).length));
                    if (source) this.task = Tasks.harvest(source);
                } else {
                    if(controller.level < 2) this.task = Tasks.upgrade(controller);
                    else {
                        const site = this.room.constructionSites[0];
                        if (site) this.task = Tasks.build(site);
                    }
                }

            }
        }

        this.task?.run();
    }

}