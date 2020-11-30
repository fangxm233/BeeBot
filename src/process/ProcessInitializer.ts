import { ROLE_CARRIER, ROLE_FILLER, ROLE_MINER, ROLE_RESERVER, ROLE_SCOUT, ROLE_UPGRADER, ROLE_WORKER } from "Bee/BeeFactory";
import { ProcessBaseWork } from "./instances/baseWork";
import { ProcessBoost } from "./instances/boost";
import { ProcessCarry } from "./instances/carry";
import { ProcessFilling } from "./instances/filling"
import { ProcessMineSource } from "./instances/mineSource";
import { ProcessReserving } from "./instances/reserving";
import { ProcessScout } from "./instances/scout";
import { ProcessTower } from "./instances/tower";
import { ProcessUpgrade } from "./instances/upgrade";
import { Process } from "./Process"
import { PROCESS_BASE_WORK, PROCESS_CARRY, PROCESS_FILLING, PROCESS_MINE_SOURCE, PROCESS_RESERVING, PROCESS_SCOUT, PROCESS_TOWER, PROCESS_UPGRADE } from "./Processes";

// 注册的顺序将决定优先级
Process.registerProcess(PROCESS_FILLING, Bucket.bottom, ProcessFilling, 100, [ROLE_FILLER]);
Process.registerProcess(PROCESS_TOWER, Bucket.bottom, ProcessTower);
Process.registerProcess(PROCESS_MINE_SOURCE, Bucket.level2, ProcessMineSource, 100, [ROLE_MINER]);
Process.registerProcess(PROCESS_CARRY, Bucket.level1, ProcessCarry, 100, [ROLE_CARRIER]);
Process.registerProcess(PROCESS_UPGRADE, Bucket.level4, ProcessUpgrade, 100, [ROLE_UPGRADER]);
Process.registerProcess(PROCESS_BASE_WORK, Bucket.level3, ProcessBaseWork, 100, [ROLE_WORKER]);
Process.registerProcess(PROCESS_SCOUT, Bucket.level5, ProcessScout, 100, [ROLE_SCOUT]);
Process.registerProcess(PROCESS_RESERVING, Bucket.level6, ProcessReserving, 100, [ROLE_RESERVER]);