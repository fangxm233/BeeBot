import { bees } from 'Bee/Bee';
import { BeeFactory } from 'Bee/BeeFactory';
import { log } from 'console/log';
import { powerBees } from 'powerBee/powerBee';
import { PowerBeeFactory } from 'powerBee/powerBeeFactory';
import { profile } from 'profiler/decorator';
import { Visualizer } from 'visuals/Visualizer';
import { Process, STATE_ACTIVE, STATE_WAITING } from './Process';

@profile
export class Processes {
    private static restoreProcess(proto: protoProcess, processName: string, roomName: string, id: number) {
        const registration = Process.getProcessRegistration(processName);
        if (!registration) {
            throw new Error(`The process ${processName} has not been registered.`);
        }
        const process = registration.constructor.getInstance(proto, roomName);

        process.id = id;
        process.state = proto.st;
        process.parent = proto.p;
        process.bees = !proto.bees ? {} : _.mapValues(proto.bees, (creepNames, role) => {
            if (!role) return [];
            return _.compact(creepNames.map(creepName => {
                // 防止在reset的那个tick刚刚好有bee死亡
                if (!Game.creeps[creepName]) return undefined!;
                // 防止有多个process注册了同一个creep造成的bee引用在bees里面丢失而无法刷新creep
                if (bees[creepName]) return bees[creepName];
                const bee = BeeFactory.getInstance(role as any, process, creepName);
                bees[creepName] = bee;
                return bee;
            }));
        });
        process.powerBees = !proto.powerBees ? {} : _.mapValues(proto.powerBees, (creepNames, role) => {
            if (!role) return [];
            return _.compact(creepNames.map(creepName => {
                // 防止在reset的那个tick刚刚好有bee死亡
                if (!Game.powerCreeps[creepName]) return undefined!;
                // 防止有多个process注册了同一个creep造成的bee引用在bees里面丢失而无法刷新creep
                if (powerBees[creepName]) return powerBees[creepName];
                const bee = PowerBeeFactory.getInstance(role as any, process, creepName);
                powerBees[creepName] = bee;
                return bee;
            }));
        });
        Process.addProcess(process);
        if (proto.slt) process.sleep(proto.slt);
    }

    public static restoreProcesses() {
        log.debug('restoring processes...');
        Process.processes = {};
        Process.processesByType = {};
        Process.processesById = {};
        if (!Memory.processes) {
            Memory.processes = {};
            return;
        }
        for (const registration of Process.processRegistry) {
            const processName = registration.processName;
            const processes = Memory.processes[processName];
            if (!processes) continue;
            Process.processesByType[processName] = {};
            for (const roomName in processes) {
                const roomProcesses = processes[roomName];
                if (!Process.processes[roomName]) Process.processes[roomName] = {};
                for (const id in roomProcesses) {
                    const protoProcess = roomProcesses[id];
                    if (!protoProcess) continue;
                    try {
                        this.restoreProcess(protoProcess, processName, roomName, Number(id));
                    } catch (error) {
                        log.error(`An error occurred when restoring processes:\n${error.message}\n${error.stack}`);
                    }
                }
            }
        }
    }

    public static runAllProcesses() {
        for (const processRegistration of Process.processRegistry) {
            if (!processRegistration) continue;
            if (Game.cpu.bucket < processRegistration.suspendBucket) continue;
            const processes = Process.processesByType[processRegistration.processName];
            _.forEach(processes, process => {
                if (!process) return;
                try {
                    switch (process.state) {
                        case STATE_ACTIVE:
                            process.run();
                            return;
                        case STATE_WAITING:
                            if (process.check()) {
                                process.awake();
                                process.run();
                            }
                            return;
                    }
                } catch (e) {
                    log.error(`Error occurred in process ${process.fullId}`);
                    log.throw(e);
                    log.trace(e);
                }
            });
        }
    }

    public static showHud() {
        for (const roomName in Process.processes) {
            const processes = Process.processes[roomName];
            const visual: string[][] = [];
            _.forEach(processes, process => {
                if (!process) return;
                let info: string = process.state;
                if (info == 'sleeping') info = (process.sleepTime - Game.time).toString();
                visual.push([process.processName, info]);
            });
            Visualizer.infoBox('Processes', visual, { x: 1, y: 8, roomName }, 7.75);
        }
    }
}