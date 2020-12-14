import { Bee } from 'Bee/Bee';
import { ProcessDefendInvader } from 'process/instances/defendInvader';
import { profile } from 'profiler/decorator';

@profile
export class BeeDefendInvader extends Bee {
    public process: ProcessDefendInvader;

    protected runCore(): number | void {
        if (this.room.name != this.process.target) {
            this.travelToRoom(this.process.target);
            return;
        }

        const invaders = this.room.find(FIND_HOSTILE_CREEPS).filter(creep => creep.owner.username == 'Invader');
        if (invaders.length) {
            this.heal(this.creep);
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
                if (this.pos.isNearTo(injure)) this.heal(injure);
                else this.travelTo(injure);
                return;
            }
        }

        this.process.complete = true;
    }
}