import { Bee } from 'Bee/Bee';
import { ProcessBreakCollector } from 'process/instances/breakCollector';
import { profile } from 'profiler/decorator';

@profile
export class BeeBreaker extends Bee {
    public process: ProcessBreakCollector;

    protected runCore(): number | void {
        if(this.room.name != this.process.target || this.pos.isEdge) {
            this.travelToRoom(this.process.target);
            return;
        }

        const flags = _.filter(Game.flags, flag => {
            if(flag.name.split('_')[0] != 'b') return false;
            const structure = flag.pos.lookForStructure(STRUCTURE_WALL);
            if(!structure) {
                flag.remove();
                return false;
            }
            return true;
        });
        if(!flags.length) return;

        const flag = _.min(flags, flag => flag.name.split('_')[1]);
        const structure = flag.pos.lookForStructure(STRUCTURE_WALL)!;
        if(!this.pos.isNearTo(structure)) this.travelTo(flag);
        else this.dismantle(structure);
    }
}