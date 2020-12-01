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
import { ProcessBaseWork } from 'process/instances/baseWork';
import { ProcessFilling } from 'process/instances/filling';
import { ProcessMineSource } from 'process/instances/mineSource';
import { ProcessTower } from 'process/instances/tower';
import { ProcessUpgrade } from 'process/instances/upgrade';
import { Process } from 'process/Process';
import { PROCESS_BASE_WORK, PROCESS_FILLING, PROCESS_MINE_SOURCE, PROCESS_TOWER, PROCESS_UPGRADE, Processes } from 'process/Processes';
import { ErrorMapper, reset } from "./ErrorMapper";

export const loop = ErrorMapper.wrapLoop(() => {
    stats.reset();
    if (USE_ACTION_COUNTER) actionsCounter.init(true);
    Mem.tryInitSameMemory();
    Mem.checkAndInit();
    if (reset) globalReset();

    BeeManager.clearDiedBees();
    BeeManager.refreshBees();

    for (const room of BeeBot.colonies()) {
        const roomName = room.name;
        if (!Process.getProcess(roomName, PROCESS_FILLING)) Process.startProcess(new ProcessFilling(roomName));
        if (!Process.getProcess(roomName, PROCESS_MINE_SOURCE)) Process.startProcess(new ProcessMineSource(roomName, roomName));
        if (!Process.getProcess(roomName, PROCESS_UPGRADE)) Process.startProcess(new ProcessUpgrade(roomName));
        if (!Process.getProcess(roomName, PROCESS_TOWER)) Process.startProcess(new ProcessTower(roomName));
        if (!Process.getProcess(roomName, PROCESS_BASE_WORK)) {
            const processId = Process.startProcess(new ProcessBaseWork(roomName));
            const upgrade = Process.getProcess<ProcessUpgrade>(roomName, PROCESS_UPGRADE)!;
            upgrade.setParent(processId);
        }
        // RoomPlanner.planRoom(roomName);
    }

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
    BeeBot.OnGlobalReseted();
}
