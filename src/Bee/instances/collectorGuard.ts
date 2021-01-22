import { Bee } from 'Bee/Bee';
import { ProcessSendScore } from 'process/instances/sendScore';
import { profile } from 'profiler/decorator';

@profile
export class BeeCollectorGuard extends Bee {
    public process: ProcessSendScore;
    private ops: TravelToOptions = {
        preferHighway: true,
        allowHostile: false,
        allowSK: false,
        freshMatrix: true,
        stuckValue: 1,
        useFindRoute: true,
    };

    protected runCore(): number | void {
        this.notifyWhenAttacked(false);
        this.heal(this.creep);

        if (this.room.name != this.process.target || this.pos.isEdge) {
            this.travelToRoom(this.process.target, this.ops);
            return;
        }

        const invader = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (invader) {
            this.travelTo(invader);
            if (this.pos.isNearTo(invader)) this.rangedMassAttack();
            else this.rangedAttack(invader);
        }
    }
}