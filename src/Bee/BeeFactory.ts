import { ROLE_CARRIER, ROLE_FILLER, ROLE_MANAGER, ROLE_MINER } from "creepSpawning/setups";
import { profile } from "profiler/decorator";
import { Process } from "../Process/Process";
import { Bee } from "./Bee";
import { BeeCarrier } from "./instances/carrier";
import { BeeFiller } from "./instances/filler";
import { BeeManager } from "./instances/manager";
import { BeeMiner } from "./instances/miner";

interface RoleToBee {
    [ROLE_FILLER]: BeeFiller,
    [ROLE_MINER]: BeeMiner,
    [ROLE_CARRIER]: BeeCarrier,
    [ROLE_MANAGER]: BeeManager,
}

@profile
export class BeeFactorty {
    public static getInstance<T extends keyof RoleToBee>(creepName: string, role: T, process: Process): RoleToBee[T] | undefined {
        // 获取creep实例，不进行空值检查
        const creep = Game.creeps[creepName];

        switch (creepName) {
            case ROLE_FILLER:
                return new BeeFiller(creep, role, process);
            case ROLE_MINER:
                return new BeeMiner(creep, role, process);
            case ROLE_CARRIER:
                return new BeeCarrier(creep, role, process);
            case ROLE_MINER:
                return new BeeManager(creep, role, process);
            default:
                break;
        }
        return;
    }
}