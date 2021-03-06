import { Bee } from 'Bee/Bee';
import { ProcessDefendInvader } from 'process/instances/defendInvader';
import { profile } from 'profiler/decorator';

@profile
export class BeeDefendInvader extends Bee {
    public process: ProcessDefendInvader;

    protected runCore(): number | void {
        if (this.hitsLost) this.heal(this.creep);

        if (this.room.name != this.process.target) {
            this.travelToRoom(this.process.target);
            return;
        }

        const invaders = this.room.find(FIND_HOSTILE_CREEPS);
        if (invaders.length) {
            const invader = this.pos.findClosestByRange(invaders);
            if (this.pos.inRangeTo(invader!, 3)) this.rangedAttack(invader!);
            else this.travelTo(invader!);
            return;
        } else {
            if (this.hits < this.hitsMax) {
                this.heal(this.creep);
                return;
            }

            const injures = this.room.find(FIND_MY_CREEPS).filter(creep => creep.hitsLost);
            const injure = this.pos.findClosestByRange(injures);
            if (injure) {
                this.heal(injure);
                if(!this.pos.isNearTo(injure)) this.travelTo(injure);
                return;
            }
        }

        this.process.complete = true;
    }
}