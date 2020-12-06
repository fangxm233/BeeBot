import './Bee/BeeInitializer';
import './process/ProcessInitializer';
import './prototypes/ConstructionSite';
import './prototypes/Creep';
import './prototypes/Room';
import './prototypes/RoomObject';
import './prototypes/RoomPosition';
import './prototypes/RoomStructures';
import './prototypes/RoomVisual';
import './prototypes/Structures';
import './tasks/initializer';
import './utilities/packrat';

import actionsCounter from './profiler/actionCounter';
import stats from './profiler/stats';

import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { BeeBot } from 'BeeBot/BeeBot';
import { BeeManager } from 'beeSpawning/BeeManager';
import { USE_ACTION_COUNTER } from 'config';
import { Command } from 'console/command';
import { log } from 'console/log';
import { Intel } from 'dataManagement/Intel';
import { Mem } from 'dataManagement/Memory';
import { SegmentManager } from 'dataManagement/segmentManager';
import { clock } from 'event/Clock';
import { repeater } from 'event/Repeater';
import { timer } from 'event/Timer';
import { Processes } from 'process/Processes';
import { ErrorMapper, reset } from './ErrorMapper';

export const loop = ErrorMapper.wrapLoop(() => {
    stats.reset();
    if (USE_ACTION_COUNTER) actionsCounter.init(true);
    Mem.tryInitSameMemory();
    Mem.checkAndInit();
    if (reset) globalReset();

    BeeManager.clearDiedBees();
    BeeManager.refreshBees();
    
    BeeBot.run();

    Processes.runAllProcesses();

    repeater.repeatActions();
    timer.checkForTimesUp();
    clock.tick();

    BeeManager.run();
    Intel.handleRequests();
    SegmentManager.applySegments();

    Command.run();

    stats.commit();
    if (USE_ACTION_COUNTER) actionsCounter.save(3000);
});

function globalReset() {
    log.info('global reset');
    RoomPlanner.deserializeData();
    Processes.restoreProcesses();
    BeeBot.OnGlobalRested();
}
