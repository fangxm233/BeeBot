import { Bee, bees } from 'Bee/Bee';
import { BeeFactorty } from 'Bee/BeeFactory';
import { BeeManager } from 'beeSpawning/BeeManager';
import { WishManager } from 'beeSpawning/WishManager';
import { log } from 'console/log';
import { timer } from 'event/Timer';
import { getFreeKey } from 'utilities/utils';
import { profile } from '../profiler/decorator';

export const STATE_ACTIVE = 'a';
export const STATE_SLEEPING = 'sp';
export const STATE_WAITING = 'w';
export const STATE_SUSPENDED = 'sd';

interface ProcessRegistration {
    processName: string,
    priority: number,
    suspendBucket: number,
    wishListInterval: number,
    requiredRoles: string[],
    constructor: typeof Process,
}

@profile
export class Process {

    public static processRegistry: ProcessRegistration[] = [];
    /** 使用全ID */
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
    public processName: ProcessTypes;
    public parent: string;
    public subProcesses: string[];
    public bees: { [role: string]: Bee[] };
    public id: number;
    public closed: boolean;
    public wishManager: WishManager;

    constructor(roomName: string, processName: ProcessTypes) {
        this.roomName = roomName;
        this.processName = processName;
        this.subProcesses = [];
        this.bees = {};
        const registration = Process.getProcessRegistration(processName);
        if (registration && registration.requiredRoles.length) {
            for (const role of registration.requiredRoles) {
                this.bees[role] = [];
            }
        }
        this._state = STATE_ACTIVE;
    }

    public get memory(): protoProcess {
        return Memory.processes[this.processName][this.roomName][this.id];
    }

    private _state: ProcessState;

    public get state(): ProcessState {
        return this._state;
    }

    public set state(v: ProcessState) {
        this._state = v;
        this.memory.st = v;
    }

    /** 唤醒的目标tick */
    public get sleepTime(): number {
        return this.memory?.slt || 0;
    }

    private _fullId: string;

    public get fullId(): string {
        return this._fullId ? this._fullId : this._fullId = this.getFullId();
    }

    public get protoProcess(): protoProcess {
        const bees = _.mapValues(this.bees, bees => bees.map(bee => bee.name));
        return _.extend({
            st: this.state,
            slt: this.sleepTime ? this.sleepTime : undefined,
            p: this.parent,
            sp: this.subProcesses.length ? this.subProcesses : undefined,
            bees: Object.keys(bees).length ? bees : undefined,
        }, this.getProto());
    }

    public static registerProcess(processName: string,
                                  suspendBucket: number,
                                  constructor: typeof Process,
                                  wishListInterval: number = -1,
                                  requiredRoles: string[] = []) {
        this.processRegistry.push({
            processName,
            priority: this.processRegistry.length,
            suspendBucket,
            constructor,
            wishListInterval,
            requiredRoles,
        });
    }

    public static getProcessRegistration(processName: string) {
        return Process.processRegistry.find(registration => registration.processName == processName);
    }

    public static getInstance(proto: protoProcess, roomName: string): Process {
        throw new Error(`There is a process didn't override function 'getInstance'`);
    }

    public static getProcess<T>(Id: string): T | undefined;

    public static getProcess<T>(roomName: string, type: string): T | undefined;

    public static getProcess<T>(roomName: string, processName: string, key: string, value: any): T | undefined;

    public static getProcess<T>(a1: string, a2?: string, a3?: string, a4?: any): T | undefined {
        if (a4 !== undefined && a3 !== undefined) {
            return _.find(this.processes[a1],
                process => process && process.processName == a2 && process[a3] === a4) as unknown as T;
        }

        if (a2 !== undefined) {
            return _.find(this.processesByType[a2],
                process => process && process.roomName == a1) as unknown as T;
        }

        return this.processesById[a1] as unknown as T;
    }

    public static getProcesses<T>(roomName: string, type: ProcessTypes): T[] {
        return _.filter(this.processesByType[type], process => process && process.roomName == roomName) as unknown as T[];
    }

    public static startProcess(process: Process): string {
        if (!this.processes[process.roomName])
            this.processes[process.roomName] = {};
        if (!Memory.processes[process.processName])
            Memory.processes[process.processName] = {};
        if (!Memory.processes[process.processName][process.roomName])
            Memory.processes[process.processName][process.roomName] = [];
        if (!this.processesByType[process.processName])
            this.processesByType[process.processName] = {};

        const free = getFreeKey(Memory.processes[process.processName][process.roomName]);
        process.id = free;
        this.processes[process.roomName][process.fullId] = process;
        this.processesById[process.fullId] = process;
        this.processesByType[process.processName][process.fullId] = process;
        Memory.processes[process.processName][process.roomName][free] = process.protoProcess;

        const registration = this.processRegistry.find(r => r.processName == process.processName);
        if (registration && registration.wishListInterval != -1)
            BeeManager.addProcess(process.fullId, registration.wishListInterval);

        log.debug(process.roomName, 'process', process.processName, process.id, 'started');
        return process.fullId;
    }

    public static addProcess(process: Process) {
        if (!this.processes[process.roomName]) this.processes[process.roomName] = {};
        this.processes[process.roomName][process.fullId] = process;
        this.processesById[process.fullId] = process;
        this.processesByType[process.processName][process.fullId] = process;
        Memory.processes[process.processName][process.roomName][process.id] = process.protoProcess;

        const registration = this.processRegistry.find(r => r.processName == process.processName);
        if (registration && registration.wishListInterval != -1)
            BeeManager.addProcess(process.fullId, registration.wishListInterval);

        log.debug(process.roomName, 'process', process.processName, process.id, 'added');
    }

    public registerBee(bee: Bee, role: string) {
        this.bees[role].push(bee);
        this.memory.bees[role].push(bee.name);
        log.debug(this.roomName, this.processName, this.id, 'register', bee.name);
    }

    public removeBee(beeName: string) {
        _.forEach(this.bees, (bees, role) => {
            // 使process中的数组和bees指向同一个对象
            this.bees[role!] = bees = _.compact(bees);
            _.remove(bees, bee => bee.name == beeName);
        });
        _.forEach(this.memory.bees, bees => {
            _.pull(bees, beeName);
        });

        log.debug(this.roomName, this.processName, this.id, 'remove', beeName);
    }

    public passBee(newRole: ALL_ROLES, beeName: string, process: Process) {
        if (!process) return;
        if (!_.find(this.bees, bees => bees.find(bee => bee.name == beeName))) return;
        this.removeBee(beeName);
        bees[beeName] = BeeFactorty.getInstance(newRole, process, beeName);
        process.registerBee(bees[beeName], newRole);
    }

    public passBees(originRole: ALL_ROLES, newRole: ALL_ROLES, process: Process) {
        if (!process) return;
        const beeNames = this.bees[originRole].map(bee => bee.name);
        beeNames.forEach(beeName => this.passBee(newRole, beeName, process));
    }

    public removeSubProcess(processId: string) {
        _.pull(this.subProcesses, processId);
        _.pull(this.memory.sp, processId);
    }

    public getFullId(): string {
        return `${this.processName}_${this.roomName}_${this.id}`;
    }

    public removeParent() {
        if (!this.parent) return;
        const parent = Process.getProcess<Process>(this.parent);
        if (parent) parent.removeSubProcess(this.fullId);
        this.parent = undefined as any;
        this.memory.p = undefined as any;
    }

    public setParent(parentId: string) {
        const parent = Process.getProcess<Process>(parentId);
        if (!parent) return;
        parent.addSubProcess(this.fullId);
        this.parent = parentId;
        this.memory.p = parentId;
    }

    public awake() {
        this.state = STATE_ACTIVE;
        this.memory.slt = undefined;
        log.debug(this.roomName, this.processName, this.id, 'activated');
    }

    public sleep(targetTime: number) {
        targetTime--; // 由于timer在运行process之后调用，需要提前1tick唤醒
        if (targetTime < Game.time) {
            if (this.state == STATE_SLEEPING) this.awake();
            return;
        }
        this.state = STATE_SLEEPING;
        this.memory.slt = targetTime;
        timer.callBackAtTick(targetTime, () => this.awake());
        log.debug(this.roomName, this.processName, this.id, 'slept until', targetTime);
    }

    public wait() {
        this.state = STATE_WAITING;
        log.debug(this.roomName, this.processName, this.id, 'waiting');
    }

    public suspend() {
        this.state = STATE_SUSPENDED;
        if (this.subProcesses.length) this.subProcesses.map(
            id => Process.getProcess<Process>(id)).forEach(p => p && p.suspend());
        log.debug(this.roomName, this.processName, this.id, 'suspended');
    }

    public close(killAllCreep: boolean = true) {
        if (this.parent) this.removeParent();

        Memory.processes[this.processName][this.roomName][this.id] = undefined as any;
        Process.processes[this.roomName][this.fullId] = undefined as any;
        Process.processesById[this.fullId] = undefined as any;
        Process.processesByType[this.processName][this.fullId] = undefined as any;
        this.closed = true;

        if (killAllCreep) _.forEach(this.bees,
            (bees, role) => this.foreachBee(role!, bee => {
                if (bee.spawning) _.find(Game.spawns, spawn => spawn.spawning?.name == bee.name)?.spawning?.cancel();
                else bee.suicide();
            }));
        if (this.subProcesses.length) this.subProcesses.map(
            id => Process.getProcess<Process>(id)).forEach(p => p && p.close(killAllCreep));

        log.debug(this.roomName, this.processName, this.id, 'closed');
    }

    /**
     * 如果返回true则唤醒，false则保持等待
     */
    public check(): boolean {
        return true;
    }

    public run() {
        return;
    }

    public foreachBee(role: string, callbackFn: (bee: Bee) => void) {
        _.forEach(this.bees[role], callbackFn);
    }

    public boostedCreep(creepName: string, compoundTypes: ResourceConstant[], succeed: boolean) {
        return;
    }

    public getCreepAndWishCount(role: ALL_ROLES) {
        return (this.bees[role]?.length || 0) + (this.wishManager?.getCount(role) || 0);
    }

    public wishCreeps() {
        throw new Error(`There is a process didn't override function 'getWishlist'`);
    }

    protected getProto(): any {
        return {};
    }

    private addSubProcess(processId: string) {
        if (!Process.getProcess(processId)) return;
        this.subProcesses.push(processId);
        if (!this.memory.sp) this.memory.sp = [];
        this.memory.sp.push(processId);
    }
}

(global as any).Process = Process;