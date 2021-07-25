import { BeeClaimer } from 'Bee/instances/claimer';
import { BeeDefendInvader } from 'Bee/instances/defendInvader';
import { BeeDefendInvaderCore } from 'Bee/instances/defendInvaderCore';
import { BeeDismantler } from 'Bee/instances/dismantler';
import { BeeDrone } from 'Bee/instances/drone';
import { BeePioneer } from 'Bee/instances/pioneer';
import {
    ROLE_CARRIER,
    ROLE_CLAIMER,
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
    ROLE_UPGRADER,
    ROLE_WORKER,
} from 'declarations/constantsExport';
import { BeeFactory } from './BeeFactory';
import { BeeCarrier } from './instances/carrier';
import { BeeFiller } from './instances/filler';
import { BeeManager } from './instances/manager';
import { BeeMiner } from './instances/miner';
import { BeeReserver } from './instances/reserver';
import { BeeScout } from './instances/scout';
import { BeeUpgrader } from './instances/upgrader';
import { BeeWorker } from './instances/worker';

// 注册顺序将会决定role的优先级 先注册的初始优先级高
BeeFactory.registerBee(ROLE_FILLER, BeeFiller);
BeeFactory.registerBee(ROLE_MANAGER, BeeManager);
BeeFactory.registerBee(ROLE_CLAIMER, BeeClaimer);
BeeFactory.registerBee(ROLE_PIONEER, BeePioneer);
BeeFactory.registerBee(ROLE_DE_INVADER, BeeDefendInvader);
BeeFactory.registerBee(ROLE_DE_INVADER_CORE, BeeDefendInvaderCore);
BeeFactory.registerBee(ROLE_MINER, BeeMiner);
BeeFactory.registerBee(ROLE_CARRIER, BeeCarrier);
BeeFactory.registerBee(ROLE_RESERVER, BeeReserver);
BeeFactory.registerBee(ROLE_DRONE, BeeDrone);
BeeFactory.registerBee(ROLE_WORKER, BeeWorker);
BeeFactory.registerBee(ROLE_UPGRADER, BeeUpgrader);
BeeFactory.registerBee(ROLE_SCOUT, BeeScout);
BeeFactory.registerBee(ROLE_DISMANTLER, BeeDismantler);
