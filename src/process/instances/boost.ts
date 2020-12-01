import { Bee } from "Bee/Bee";
import { PROCESS_BOOST } from "declarations/constantsExport";
import { Process } from "process/Process";
import { profile } from "profiler/decorator";

type BoostType = 'single' | 'lasting';

@profile
export class ProcessBoost extends Process {
    public memory: protoProcessBoost;

    public type: BoostType;

    constructor(roomName: string, type: BoostType) {
        super(roomName, PROCESS_BOOST);
        this.type = type;
    }

    public registerBee(bee: Bee, role: string) {
        super.registerBee(bee, role);
        bee.lock();
    }

    private freeBee(bee: Bee) {
        bee.unlock();
        this.removeBee(bee.name);
    }
}