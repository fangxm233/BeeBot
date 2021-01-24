import {
    PROCESS_BASE_WORK,
    PROCESS_BREAK_COLLECTOR,
    PROCESS_CARRY,
    PROCESS_COLONIZE,
    PROCESS_DEFEND_INVADER,
    PROCESS_DEFEND_INVADER_CORE,
    PROCESS_DEFEND_NUKE,
    PROCESS_DISMANTLE,
    PROCESS_FILLING,
    PROCESS_LAB_REACT,
    PROCESS_MINE_MINERAL,
    PROCESS_MINE_SOURCE,
    PROCESS_REPAIR,
    PROCESS_RESERVING,
    PROCESS_SCOUT,
    PROCESS_SEND_SCORE,
    PROCESS_TAKE_SCORE,
    PROCESS_TOWER,
    PROCESS_UPGRADE,
    ROLE_BREAKER,
    ROLE_CARRIER,
    ROLE_CLAIMER,
    ROLE_COLLECTOR_GUARD,
    ROLE_DE_INVADER,
    ROLE_DE_INVADER_CORE,
    ROLE_DISMANTLER,
    ROLE_DRONE,
    ROLE_FILLER,
    ROLE_MANAGER,
    ROLE_MINER,
    ROLE_PIONEER,
    ROLE_RESERVER,
    ROLE_SCOUT,
    ROLE_SEND_SCORE,
    ROLE_TAKE_SCORE,
    ROLE_UPGRADER,
    ROLE_WORKER,
} from 'declarations/constantsExport';
import { ProcessBreakCollector } from 'process/instances/breakCollector';
import { ProcessDefendInvader } from 'process/instances/defendInvader';
import { ProcessDefendInvaderCore } from 'process/instances/defendInvaderCore';
import { ProcessDefendNuke } from 'process/instances/defendNuke';
import { ProcessDismantle } from 'process/instances/dismantle';
import { ProcessLabReact } from 'process/instances/labReact';
import { ProcessMineMineral } from 'process/instances/mineMineral';
import { ProcessRepair } from 'process/instances/repair';
import { ProcessSendScore } from 'process/instances/sendScore';
import { ProcessTakeScore } from 'process/instances/takeScore';
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
Process.registerProcess(PROCESS_DEFEND_INVADER, Bucket.level3, ProcessDefendInvader, 100, [ROLE_DE_INVADER]);
Process.registerProcess(PROCESS_DEFEND_INVADER_CORE, Bucket.level3, ProcessDefendInvaderCore, 100, [ROLE_DE_INVADER_CORE]);
Process.registerProcess(PROCESS_DISMANTLE, Bucket.level4, ProcessDismantle, 100, [ROLE_DISMANTLER]);
Process.registerProcess(PROCESS_DEFEND_NUKE, Bucket.level2, ProcessDefendNuke, 100, [ROLE_WORKER]);
Process.registerProcess(PROCESS_MINE_MINERAL, Bucket.level4, ProcessMineMineral, 100, [ROLE_DRONE, ROLE_CARRIER]);
Process.registerProcess(PROCESS_LAB_REACT, Bucket.level4, ProcessLabReact);
Process.registerProcess(PROCESS_TAKE_SCORE, Bucket.level3, ProcessTakeScore, 100, [ROLE_TAKE_SCORE]);
Process.registerProcess(PROCESS_SEND_SCORE, Bucket.level3, ProcessSendScore, 50, [ROLE_SEND_SCORE, ROLE_COLLECTOR_GUARD]);
Process.registerProcess(PROCESS_BREAK_COLLECTOR, Bucket.level3, ProcessBreakCollector, 100, [ROLE_BREAKER]);