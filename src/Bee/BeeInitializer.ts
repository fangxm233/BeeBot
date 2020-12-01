import { ROLE_CARRIER, ROLE_FILLER, ROLE_MANAGER, ROLE_MINER, ROLE_RESERVER, ROLE_SCOUT, ROLE_UPGRADER, ROLE_WORKER } from "declarations/constantsExport";
import { BeeFactorty } from "./BeeFactory";
import { BeeCarrier } from "./instances/carrier";
import { BeeFiller } from "./instances/filler";
import { BeeManager } from "./instances/manager";
import { BeeMiner } from "./instances/miner";
import { BeeReserver } from "./instances/reserver";
import { BeeScout } from "./instances/scout";
import { BeeUpgrader } from "./instances/upgrader";
import { BeeWorker } from "./instances/worker";

// 注册顺序将会决定role的优先级 先注册的初始优先级高
BeeFactorty.registerBee(ROLE_FILLER, BeeFiller);
BeeFactorty.registerBee(ROLE_MINER, BeeMiner);
BeeFactorty.registerBee(ROLE_CARRIER, BeeCarrier);
BeeFactorty.registerBee(ROLE_MANAGER, BeeManager);
BeeFactorty.registerBee(ROLE_WORKER, BeeWorker);
BeeFactorty.registerBee(ROLE_UPGRADER, BeeUpgrader);
BeeFactorty.registerBee(ROLE_SCOUT, BeeScout);
BeeFactorty.registerBee(ROLE_RESERVER, BeeReserver);