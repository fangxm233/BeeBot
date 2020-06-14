import { BeeFactorty } from "Bee/BeeFactory";
import { log } from "console/log";
import { profile } from "../profiler/decorator";
import { Visualizer } from "../visuals/Visualizer";
import { Process, stateToFull } from "./process";

@profile
export class Processes {
    public static restoreProcess(proto: protoProcess, processName: string, roomName: string, id: number) {
        const registration = Process.processRegistry.find(registration => registration.processName == processName);
        if(!registration) {
            throw new Error(`This process ${processName} has not been registered.`)
        }
        const process = registration.constructor.getInstance(proto, roomName);

        process.id = id;
        Process.addProcess(process);
        process.memory = proto;
        process.state = stateToFull(proto.st);
        process.parent = proto.p;
        process.bees = !proto.bees ? {} : _.mapValues(proto.bees, (creepNames, role) => {
            if (!role) return [];
            return creepNames.map(creepName => BeeFactorty.getInstance(creepName, role as any, process!));
        });
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
                        this.restoreProcess(protoProcess, processName, roomName, id as any);
                    } catch (error) {
                        log.error(`An error occured when restoring processes:\n${error.message}`);
                    }
                }
            }
        }
    }

    public static runAllProcesses() {
        for (const processRegistration of Process.processRegistry) {
            if(!processRegistration) continue;
            if (Game.cpu.bucket < processRegistration.suspendBucket) continue;
            const processes = Process.processesByType[processRegistration.processName];
            _.forEach(processes, process => {
                if (!process) return;
                process.memory = Memory.processes[process.processName][process.roomName][process.id];
                switch (process.state) {
                    case 'active':
                        process.run();
                        return;
                    case 'waiting':
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