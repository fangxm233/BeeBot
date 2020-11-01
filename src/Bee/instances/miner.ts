import { Bee } from "Bee/Bee";
import { ProcessMineSource } from "process/instances/mineSource";
import { profile } from "profiler/decorator";

@profile
export class BeeMiner extends Bee {
    private sourceId: Id<Source>;
    public process: ProcessMineSource;

    public get memory(): CreepMinerMemory {
        return this.creep.memory as CreepMinerMemory;
    }

    public runCore() {
        if (!this.sourceId) this.sourceId = this.process.sources[this.memory.s];
        const source = Game.getObjectById(this.sourceId)!;
        if (!this.pos.isNearTo(source)) {
            this.travelTo(source);
            return;
        }

        this.harvest(source);
    }
}