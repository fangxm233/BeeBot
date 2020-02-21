import { Bee } from "Bee/Bee";
import { Process } from "process/Process";
import { PROCESS_FILLING } from "process/Processes";
import { profile } from "profiler/decorator";

type BoostType = 'single' | 'lasting';

@profile
export class ProcessBoost extends Process{
    public memory: protoProcessBoost;

    public type: BoostType;

    constructor(roomName: string, type: BoostType) {
        super(roomName, PROCESS_FILLING);
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