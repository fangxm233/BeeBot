import {
    PROCESS_BASE_WORK,
    PROCESS_CARRY,
    PROCESS_COLONIZE,
    PROCESS_FILLING,
    PROCESS_MINE_SOURCE,
    PROCESS_REPAIR,
    PROCESS_RESERVING,
    PROCESS_SCOUT,
    PROCESS_TOWER,
    PROCESS_UPGRADE,
    ROLE_CARRIER,
    ROLE_CLAIMER,
    ROLE_FILLER,
    ROLE_MANAGER,
    ROLE_MINER,
    ROLE_PIONEER,
    ROLE_RESERVER,
    ROLE_SCOUT,
    ROLE_UPGRADER,
    ROLE_WORKER,
} from 'declarations/constantsExport';
import { ProcessRepair } from 'process/instances/repair';
import { ProcessBaseWork } from './instances/baseWork';
import { ProcessCarry } from './instances/carry';
import { ProcessColonize } from './instances/colonize';
import { ProcessFilling } from './instances/filling';
import { ProcessMineSource } from './instances/mineSource';
import { ProcessReserving } from './instances/reserving';
import { ProcessScout } from './instances/scout';
import { ProcessTower } from './instances/tower';
import { ProcessUpgrade } from './instances/upgrade';
import { Process } from './Process';

// 注册的顺序将决定优先级
Process.registerProcess(PROCESS_FILLING, Bucket.bottom, ProcessFilling, 100, [ROLE_FILLER]);
Process.registerProcess(PROCESS_TOWER, Bucket.bottom, ProcessTower);
Process.registerProcess(PROCESS_MINE_SOURCE, Bucket.level2, ProcessMineSource, 100, [ROLE_MINER]);
Process.registerProcess(PROCESS_CARRY, Bucket.level1, ProcessCarry, 100, [ROLE_CARRIER]);
Process.registerProcess(PROCESS_UPGRADE, Bucket.level4, ProcessUpgrade, 100, [ROLE_UPGRADER]);
Process.registerProcess(PROCESS_BASE_WORK, Bucket.level3, ProcessBaseWork, 100, [ROLE_WORKER, ROLE_MANAGER]);
Process.registerProcess(PROCESS_SCOUT, Bucket.level5, ProcessScout, 100, [ROLE_SCOUT]);
Process.registerProcess(PROCESS_RESERVING, Bucket.level6, ProcessReserving, 100, [ROLE_RESERVER]);
Process.registerProcess(PROCESS_COLONIZE, Bucket.level3, ProcessColonize, 100, [ROLE_PIONEER, ROLE_CLAIMER]);
Process.registerProcess(PROCESS_REPAIR, Bucket.level3, ProcessRepair, 100, [ROLE_WORKER]);