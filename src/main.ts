// tslint:disable: ordered-imports
import './prototypes/ConstructionSite';
import './prototypes/Creep';
import './prototypes/Room';
import './prototypes/RoomObject';
import './prototypes/RoomPosition';
import './prototypes/RoomStructures';
import './prototypes/RoomVisual';
import './prototypes/Structures';
import './Bee/BeeInitializer';
import './process/ProcessInitializer';
import './tasks/initializer';

import actionsCounter from './profiler/actionCounter';
import stats from './profiler/stats';

import { USE_ACTION_COUNTER } from 'config';
import { ErrorMapper, reset } from "./ErrorMapper";
import { Processes, PROCESS_BOOST, PROCESS_FILLING, PROCESS_MINE_SOURCE } from 'process/Processes';
import { BeeManager } from 'beeSpawning/BeeManager';
import { repeater } from 'event/Repeater';
import { timer } from 'event/Timer';
import { Process } from 'process/Process';
import { ProcessFilling } from 'process/instances/filling';
import { Mem } from 'memory/Memory';
import { log } from 'console/log';
import { ProcessMineSource } from 'process/instances/mineSource';
import { ProcessBoost } from 'process/instances/boost';

export const loop = ErrorMapper.wrapLoop(() => {
    stats.reset();
    if (USE_ACTION_COUNTER) actionsCounter.init(true);
    Mem.tryInitSameMemory();
    Mem.checkAndInit();
    if (reset) globalReset();

    BeeManager.clearDiedBees();
    BeeManager.run();

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (!Process.getProcess(roomName, PROCESS_FILLING)) Process.startProcess(new ProcessFilling(roomName));
        if (!Process.getProcess(roomName, PROCESS_MINE_SOURCE)) Process.startProcess(new ProcessMineSource(roomName, roomName));
        if (!Process.getProcess(roomName, PROCESS_BOOST)) Process.startProcess(new ProcessBoost(roomName, 's'))
    }

    Processes.runAllProcesses();

    repeater.repeatActions();
    timer.checkForTimesUp();

    stats.commit();
});

function globalReset() {
    log.info('global reset');
    Processes.restoreProcesses();
}
