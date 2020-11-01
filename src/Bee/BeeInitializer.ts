import { BeeFactorty, ROLE_CARRIER, ROLE_FILLER, ROLE_MANAGER, ROLE_MINER, ROLE_UPGRADER } from "./BeeFactory";
import { BeeCarrier } from "./instances/carrier";
import { BeeFiller } from "./instances/filler";
import { BeeManager } from "./instances/manager";
import { BeeMiner } from "./instances/miner";
import { BeeUpgrader } from "./instances/upgrader";

// 注册顺序将会决定role的优先级 先注册的优先级高
BeeFactorty.registerBee(ROLE_FILLER, BeeFiller);
BeeFactorty.registerBee(ROLE_MINER, BeeMiner);
BeeFactorty.registerBee(ROLE_CARRIER, BeeCarrier);
BeeFactorty.registerBee(ROLE_MANAGER, BeeManager);
BeeFactorty.registerBee(ROLE_UPGRADER, BeeUpgrader);