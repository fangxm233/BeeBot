import { Bee } from 'Bee/Bee';
import { ProcessSendScore } from 'process/instances/sendScore';
import { profile } from 'profiler/decorator';
import { timer } from 'event/Timer';
import { timeAfterTick } from 'utilities/helpers';

@profile
export class BeeSendScore extends Bee {
    public process: ProcessSendScore;
    private ops: TravelToOptions = {
        ignoreCreeps: false,
        preferHighway: true,
        allowHostile: false,
        allowSK: false,
        freshMatrix: true,
        stuckValue: 1,
        repath: 0.1,
        useFindRoute: true,
    };

    protected runCore(): number | void {
        if (!this.store.getUsedCapacity(RESOURCE_SCORE)) {
            const room = Game.rooms[this.process.roomName];
            if (!room?.storage) return;
            if (!room.storage.store.score) return;
            if (!this.pos.isNearTo(room.storage)) this.travelTo(room.storage, this.ops);
            else this.withdraw(room.storage, RESOURCE_SCORE);
            return;
        }

        if (this.room.name != this.process.target || this.pos.isEdge) {
            this.travelToRoom(this.process.target, this.ops);
            return;
        }

        const collector = this.room.scoreCollector;
        if (!collector) return;
        if (!this.pos.isNearTo(collector)) this.travelTo(collector, this.ops);
        else {
            if (!this.arriveTick) this.arriveTick = 1500 - this.ticksToLive;
            const amount = Math.min(this.store.getUsedCapacity(RESOURCE_SCORE), collector.store.getFreeCapacity(RESOURCE_SCORE));
            this.transfer(collector, RESOURCE_SCORE);
            if (amount >= this.store.getUsedCapacity(RESOURCE_SCORE)) {
                if (this.ticksToLive < this.arriveTick * 2.5) {
                    timer.callBackAtTick(timeAfterTick(1), () => this.suicide());
                }
            }
        }
    }
}