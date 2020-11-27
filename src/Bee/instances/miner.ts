import { Bee } from "Bee/Bee";
import { ProcessMineSource } from "process/instances/mineSource";
import { profile } from "profiler/decorator";

@profile
export class BeeMiner extends Bee {
    private sourcePos: RoomPosition;
    public process: ProcessMineSource;

    public get memory(): BeeMinerMemory {
        return this.creep.memory as BeeMinerMemory;
    }

    public runCore() {
        if (!this.sourcePos) this.sourcePos = this.process.sources[this.memory.s];
        if (!this.pos.isNearTo(this.sourcePos)) {
            this.travelTo(this.sourcePos);
            return;
        }

        const source = this.sourcePos.lookFor(LOOK_SOURCES)[0];
        this.harvest(source);
    }
}