import { BeeClaimer } from 'Bee/instances/claimer';
import { BeePioneer } from 'Bee/instances/pioneer';
import {
    ROLE_CARRIER,
    ROLE_CLAIMER, ROLE_DE_INVADER, ROLE_DE_INVADER_CORE,
    ROLE_FILLER,
    ROLE_MANAGER,
    ROLE_MINER,
    ROLE_PIONEER,
    ROLE_RESERVER,
    ROLE_SCOUT,
    ROLE_UPGRADER,
    ROLE_WORKER,
} from 'declarations/constantsExport';
import { BeeFactorty } from './BeeFactory';
import { BeeCarrier } from './instances/carrier';
import { BeeFiller } from './instances/filler';
import { BeeManager } from './instances/manager';
import { BeeMiner } from './instances/miner';
import { BeeReserver } from './instances/reserver';
import { BeeScout } from './instances/scout';
import { BeeUpgrader } from './instances/upgrader';
import { BeeWorker } from './instances/worker';
import { BeeDefendInvader } from 'Bee/instances/defendInvader';
import { BeeDefendInvaderCore } from 'Bee/instances/defendInvaderCore';

// 注册顺序将会决定role的优先级 先注册的初始优先级高
BeeFactorty.registerBee(ROLE_FILLER, BeeFiller);
BeeFactorty.registerBee(ROLE_MANAGER, BeeManager);
BeeFactorty.registerBee(ROLE_CLAIMER, BeeClaimer);
BeeFactorty.registerBee(ROLE_PIONEER, BeePioneer);
BeeFactorty.registerBee(ROLE_DE_INVADER, BeeDefendInvader);
BeeFactorty.registerBee(ROLE_DE_INVADER_CORE, BeeDefendInvaderCore);
BeeFactorty.registerBee(ROLE_MINER, BeeMiner);
BeeFactorty.registerBee(ROLE_CARRIER, BeeCarrier);
BeeFactorty.registerBee(ROLE_WORKER, BeeWorker);
BeeFactorty.registerBee(ROLE_UPGRADER, BeeUpgrader);
BeeFactorty.registerBee(ROLE_SCOUT, BeeScout);
BeeFactorty.registerBee(ROLE_RESERVER, BeeReserver);
