import { Bee, bees } from "Bee/Bee";
import { BeeFactorty } from "Bee/BeeFactory";
import { log } from "console/log";
import { profile } from "../profiler/decorator";
import { Visualizer } from "../visuals/Visualizer";
import { Process, STATE_ACTIVE, STATE_WAITING } from "./Process";

export const PROCESS_FILLING = 'filling';
export const PROCESS_MINE_SOURCE = 'mineSource';
export const PROCESS_UPGRADE = 'upgrade';
export const PROCESS_BASE_WORK = 'baseWork';
export const PROCESS_BOOST = 'boost';
export const PROCESS_SCOUT = 'scout';
export const PROCESS_TOWER = 'tower';
export const PROCESS_RESERVING = 'reserving';
export const PROCESS_CARRY = 'carry';

@profile
export class Processes {
    private static restoreProcess(proto: protoProcess, processName: string, roomName: string, id: number) {
        const registration = Process.getProcessRegistration(processName);
        if (!registration) {
            throw new Error(`The process ${processName} has not been registered.`);
        }
        const process = registration.constructor.getInstance(proto, roomName);

        process.id = id;
        process.memory = proto;
        process.state = proto.st;
        process.parent = proto.p;
        process.bees = !proto.bees ? {} : _.mapValues(proto.bees, (creepNames, role) => {
            if (!role) return [];
            return _.compact(creepNames.map(creepName => {
                // 防止在reset的那个tick刚刚好有bee死亡
                if (!Game.creeps[creepName]) return undefined as unknown as Bee;
                const bee = BeeFactorty.getInstance(role as any, process, creepName);
                bees[creepName] = bee;
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
        for (const processName in Memory.processes) {
            const processes = Memory.processes[processName];
            Process.processesByType[processName] = {};
            for (const roomName in processes) {
                const roomProcesses = processes[roomName];
                Process.processes[roomName] = {};
                for (const id in roomProcesses) {
                    const protoProcess = roomProcesses[id];
                    try {
                        this.restoreProcess(protoProcess, processName, roomName, Number(id));
                    } catch (error) {
                        log.error(`An error occured when restoring processes:\n${error.message}\n${error.stack}`);
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
                visual.push([process.processName, info])
            })
            Visualizer.infoBox('Processes', visual, { x: 1, y: 8, roomName }, 7.75);
        }
    }
}