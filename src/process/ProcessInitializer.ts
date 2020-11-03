import { ROLE_FILLER, ROLE_MINER, ROLE_UPGRADER, ROLE_WORKER } from "Bee/BeeFactory";
import { ProcessBaseWork } from "./instances/baseWork";
import { ProcessBoost } from "./instances/boost";
import { ProcessFilling } from "./instances/filling"
import { ProcessMineSource } from "./instances/mineSource";
import { ProcessUpgrade } from "./instances/upgrade";
import { Process } from "./Process"
import { PROCESS_BASE_WORK, PROCESS_BOOST, PROCESS_FILLING, PROCESS_MINE_SOURCE, PROCESS_UPGRADE } from "./Processes";

// 注册的顺序将决定优先级
Process.registerProcess(PROCESS_FILLING, Bucket.bottom, ProcessFilling, 100, [ROLE_FILLER]);
Process.registerProcess(PROCESS_MINE_SOURCE, Bucket.level2, ProcessMineSource, 100, [ROLE_MINER]);
Process.registerProcess(PROCESS_UPGRADE, Bucket.level4, ProcessUpgrade, 100, [ROLE_UPGRADER]);
Process.registerProcess(PROCESS_BASE_WORK, Bucket.level3, ProcessBaseWork, 100, [ROLE_WORKER]);