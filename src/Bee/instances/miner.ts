import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";

@profile
export class BeeMiner extends Bee {
    public get memory(): CreepMinerMemory {
        return this.creep.memory as CreepMinerMemory;
    }


}