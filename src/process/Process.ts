import { Bee } from "Bee/Bee";
import { log } from "console/log";
import { timer } from "event/Timer";
import { getFreeKey } from "utilities/utils";
import { profile } from "../profiler/decorator";

type ProcessState = 'sleeping' | 'active' | 'suspended';

@profile
export class Process{

    /** 使用短ID */
    public static processes: {
        [roomName: string]: {
            [processId: string]: Process
        };
    } = {};

    /** 使用全ID */
    public static processesById: {
        [processId: string]: Process;
    } = {};

    /** 使用全ID */
    public static processesByType: {
        [processName: string]: {
            [processId: string]: Process;
        }
    } = {};

    public roomName: string;
    public processName: string;
    public bees: {[role: string]: Bee[] } = {default: []};
    public id: number;

    private _state: ProcessState;
    public set state(v : ProcessState) {
        this._state = v;
        this.memory.state = v;
    }
    public get state() : ProcessState {
        return this._state;
    }
    
    /** 唤醒的目标tick */
    public get sleepTime() : number {
        return this.memory.slt || 0;
    }

    private _fullId: string;
    public get fullId(): string{
        return this._fullId ? this._fullId : this._fullId = this.getFullId();
    }

    public get protoProcess(): protoProcess {
        return {
            name: this.processName,
            state: this.state,
            bees: _.mapValues(this.bees, bees => bees.map(bee => bee.name)),
        }
    }

    public memory: protoProcess;

    constructor(roomName: string, processName: string){
        this.roomName = roomName;
        this.processName = processName;
        this._state = 'active';
    }

    public registerBee(bee: Bee, role: string){
        this.bees[role].push(bee);
        this.memory.bees[role].push(bee.name);
        log.debug(this.roomName, this.processName, this.id, 'register', bee.name);
    }
    public removeBee(beeName: string){
        _.forEach(this.bees, bees => {
            _.remove(bees, bee => bee.name == beeName)
        });
        _.forEach(this.memory.bees, bees => {
            _.pull(bees, beeName);
        })
        log.debug(this.roomName, this.processName, this.id, 'remove', beeName);
    }

    public getFullId(): string {
        return `${this.roomName}_${this.id}`;
    }

    public awake(){
        this.state = 'active';
        delete this.memory.slt;
        log.debug(this.roomName, this.processName, this.id, 'activated');
    }
    public sleep(targetTime: number){
        this.state = 'sleeping';
        this.memory.slt = targetTime;
        timer.callBackAtTick(this, targetTime, this.awake);
        log.debug(this.roomName, this.processName, this.id, 'slept until', targetTime);
    }
    public suspend(){
        this.state = 'suspended';
        log.debug(this.roomName, this.processName, this.id, 'suspended');
    }
    public close(killAllCreep: boolean = true){
        Memory.processes[this.roomName][this.id] = undefined as any;
        Process.processes[this.roomName][this.id] = undefined as any;
        Process.processesById[this.fullId] = undefined as any;
        Process.processesByType[this.processName][this.fullId] = undefined as any;

        if(killAllCreep) _.forEach(this.bees, (bees, role) => this.foreachBee(role!, bee => bee.suicide()))

        log.info(this.roomName, this.processName, this.id, 'closed');
    }

    /**
     * 如果返回true则唤醒，false则保持挂起
     */
    public check(): boolean{
        return true;
    }
    public run() {
        return;
    }
    public foreachBee(role: string, callbackfn: (creep: Bee) => void){
        _.forEach(this.bees[role], callbackfn)
    }

    public boostedCreep(creepName: string, compoundTypes: ResourceConstant[]) {
        return;
    }

    public static getInstance(struct: protoProcess, roomName: string): Process {
        return new Process(roomName, struct.name);
    }

    public static getProcess(Id: string): Process | undefined;
    public static getProcess(roomName: string, type: string): Process | undefined;
    public static getProcess(roomName: string, processName: string, key: string, value: any): Process | undefined;

    public static getProcess(a1: string, a2?: string, a3?: string, a4?: any): Process | undefined {
        if(a4 !== undefined && a3 !== undefined) {
            return _.find(this.processes[a1], process => process && process.processName == a2 && process[a3] === a4);
        }

        if(a2 !== undefined) {
            return _.find(this.processesByType[a2], process => process && process.roomName == a1);
        }

        return this.processesById[a1];
    }

    public static startProcess(process: Process): string{
        if(!this.processes[process.roomName]) this.processes[process.roomName] = {};
        if(!Memory.processes[process.roomName]) Memory.processes[process.roomName] = [];
        if(!this.processesByType[process.processName]) this.processesByType[process.processName] = {};
        
        const free = getFreeKey(Memory.processes[process.roomName]);
        process.id = free;
        this.processes[process.roomName][free] = process;
        this.processesById[process.fullId] = process;
        this.processesByType[process.processName][process.fullId] = process;
        Memory.processes[process.roomName][free] = process.protoProcess;
        process.memory = Memory.processes[process.roomName][free];
        log.info(process.roomName, 'process', process.processName, process.id, 'started');
        return process.fullId;
    }
    public static addProcess(process: Process){
        if(!this.processes[process.roomName]) this.processes[process.roomName] = {};
        this.processes[process.roomName][process.id] = process;
        this.processesById[process.fullId] = process;
        this.processesByType[process.processName][process.fullId] = process;
        log.debug(process.roomName, 'process', process.processName, process.id, 'added');
    }
}
