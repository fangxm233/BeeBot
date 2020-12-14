import { Bee } from 'Bee/Bee';
import { ProcessDefendInvaderCore } from 'process/instances/defendInvaderCore';
import { profile } from 'profiler/decorator';

@profile
export class BeeDefendInvaderCore extends Bee {
    public process: ProcessDefendInvaderCore;

    protected runCore(): number | void {
        if (this.room.name != this.process.target) {
            this.travelToRoom(this.process.target);
            return;
        }

        const core = this.room.invaderCore;
        if (core) {
            if (this.pos.isNearTo(core)) this.attack(core);
            else this.travelTo(core);
            return;
        }

        this.process.complete = true;
    }
}