import { Bee } from 'Bee/Bee';
import { ProcessTakeScore } from 'process/instances/takeScore';
import { profile } from 'profiler/decorator';

@profile
export class BeeTakeScore extends Bee {
    public process: ProcessTakeScore;
    private ops: TravelToOptions = {
        ignoreCreeps: false,
        preferHighway: true,
        allowHostile: false,
        allowSK: false,
        freshMatrix: true,
        stuckValue: 1,
        repath: 0.1,
        useFindRoute: true
    };

    protected runCore(): number | void {
        if (this.store.getUsedCapacity(RESOURCE_SCORE)) this.runBack();
        else this.runTake();
    }

    private runBack() {
        if (this.room.name == this.process.roomName) {
            if (!this.room.storage) return;
            if (this.pos.isNearTo(this.room.storage)) this.transfer(this.room.storage, RESOURCE_SCORE);
            else this.travelTo(this.room.storage);
            return;
        }
        this.travelToRoom(this.process.roomName, this.ops);
    }

    private runTake() {
        if (this.room.name != this.process.target || this.pos.isEdge) {
            this.travelToRoom(this.process.target, this.ops);
            return;
        }
        const drops = this.room.drops[RESOURCE_SCORE];
        const drop = this.pos.findClosestByRange(drops);
        if (drop) {
            if (this.pos.isNearTo(drop)) this.pickup(drop);
            else this.travelTo(drop, this.ops);
            return;
        }

        const containers = this.room.scoreContainers.filter(container => !!container.store.getUsedCapacity(RESOURCE_SCORE));
        const container = this.pos.findClosestByRange(containers);
        if (container) {
            if (this.pos.isNearTo(container)) this.withdraw(container, RESOURCE_SCORE);
            else this.travelTo(container, this.ops);
        }
    }
}