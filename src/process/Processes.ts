import { Bee, toBee } from "Bee/Bee";
import { BeeFactorty } from "Bee/BeeFactory";
import { log } from "console/log";
import { profile } from "../profiler/decorator";
import { Visualizer } from "../visuals/Visualizer";
import { ProcessFilling } from "./instances/filling";
import { Process } from "./process";

export const PROCESS_FILLING = 'filling';
export const PROCESS_MINE_SOURCE = 'mineSource';
export const PROCESS_BOOST = 'boost';

const processSuspendBucket: {[processName: string]: number} = {
    [PROCESS_FILLING]: 500,
    [PROCESS_BOOST]: 1000,
    [PROCESS_MINE_SOURCE]: 5000,
}

@profile
export class Processes{
    public static processFilling(roomName: string): ProcessFilling{
        const process = new ProcessFilling(roomName);
        Process.startProcess(process);
        return process;
    }

    public static restoreProcess(processI: protoProcess, roomName: string, id: number){
        let process: Process | undefined = undefined;

        switch (processI.name) {
            case 'filling':
                process = ProcessFilling.getInstance(processI, roomName);
                break;
            default:
                break;
        }
        if(process){
            process.id = id;
            Process.addProcess(process);
            process.memory = processI;
            process.state = processI.state;
            process.bees = _.mapValues(processI.bees, (creepNames, role) => {
                if(!role) return [];
                return creepNames.map(creepName => BeeFactorty.getInstance(creepName, role as any, process!));
            });
            if(processI.slt) process.sleep(processI.slt);
        }
    }

    public static restoreProcesses(){
        log.debug('restoring processes...');
        Process.processes = {};
        Process.processesByType = {};
        Process.processesById = {};
        if(!Memory.processes){
            Memory.processes = {};
            return;
        }
        for (const roomName in Memory.processes) {
            const processes = Memory.processes[roomName];
            Process.processes[roomName] = {};
            for (const id in processes) {
                const processInterface = processes[id];
                if(!processInterface) continue;
                if(!Process.processesByType[processInterface.name]) Process.processesByType[processInterface.name] = {};
                this.restoreProcess(processInterface, roomName, id as any);
            }
        }
    }

    public static runAllProcesses(){
        for (const processName in processSuspendBucket) {
            if(Game.cpu.bucket < processSuspendBucket[processName]) continue;
            const processes = Process.processesByType[processName];
            _.forEach(processes, process => {
                if(!process) return;
                process.memory = Memory.processes[process.roomName][process.id];
                switch (process.state) {
                    case 'sleeping':
                        return;
                    case 'active':
                        process.run();
                        return;
                    case 'suspended':
                        if(process.check()) {
                            process.awake();
                            process.run();
                        }
                        return;
                }
            })
        }
    }

    public static showHud(){
        for (const roomName in Process.processes) {
            const processes = Process.processes[roomName];
            const visual: string[][] = [];
            _.forEach(processes, process => {
                if(!process) return;
                let info: string = process.state;
                if(info == 'sleeping') info = (process.sleepTime - Game.time).toString();
                visual.push([process.processName, info])
            })
            Visualizer.infoBox('Processes', visual, { x: 1, y: 8, roomName }, 7.75);
        }
    }
}