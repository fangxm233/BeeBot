import { TargetCache } from 'caching/caching';
import { isStoreStructure } from 'declarations/typeGuards';
import { timer } from 'event/Timer';
import { Traveler } from 'movement/Traveler';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import { ITask } from 'tasks';
import { initializeTask } from 'tasks/initializer';
import { getFreeCapacity, timeAfterTick } from 'utilities/helpers';

export const powerBees: { [beeName: string]: PowerBee } = {};

export function toPowerBee(creep: PowerCreep | string): PowerBee | undefined {
    if (typeof creep == 'string') return powerBees[creep];
    return powerBees[creep.name];
}

/**
 * Bee是一个creep的包装，负责creep的任务生成和执行，封装了creep的所有动作和属性。是其他职能Bee的父类。
 */
@profile
export class PowerBee {
    public role: ALL_ROLES; // bee的角色
    public process: Process; // 管理他的process
    public creep: PowerCreep; // 管理的creep

    public notify: boolean;

    public locked: boolean = false;
    public slept: boolean = false;
    public cyclingCallbackId: string;

    private setNotify: boolean = true;

    constructor(role: ALL_ROLES, process: Process, creep?: PowerCreep, notify: boolean = true) {
        this.role = role;
        this.creep = creep as PowerCreep;
        this.process = process;
        this.notify = notify;
    }

    // creep的属性

    public get effects(): RoomObjectEffect[] {
        return this.creep.effects;
    }

    public get pos(): RoomPosition {
        return this.creep.pos;
    }

    public get room(): Room | undefined {
        return this.creep.room;
    }

    public get hits(): number {
        return this.creep.hits;
    }

    public get hitsMax(): number {
        return this.creep.hitsMax;
    }

    public get memory(): PowerCreepMemory {
        return this.creep.memory;
    }

    public get my(): boolean {
        return this.creep.my;
    }

    public get name(): string {
        return this.creep.name;
    }

    public get owner(): Owner {
        return this.creep.owner;
    }

    public get saying(): string {
        return this.creep.saying;
    }

    public get store(): StoreDefinition {
        return this.creep.store;
    }

    public get ticksToLive(): number {
        return this.creep.ticksToLive || this.lifeTime;
    }


    private _lifeTime: number;
    public get lifeTime(): number {
        return POWER_CREEP_LIFE_TIME;
    }

    private _task: ITask | null;
    public get task(): ITask | null {
        if (!this._task) {
            const protoTask = this.memory.task;
            this._task = protoTask ? initializeTask(protoTask) : null;
        }
        return this._task;
    }

    public set task(task: ITask | null) {
        // Assert that there is an up-to-date target cache
        TargetCache.assert();
        // Unregister target from old task if applicable
        const oldProtoTask = this.memory.task as protoTask;
        if (oldProtoTask) {
            const oldRef = oldProtoTask._target.ref;
            if (Game.TargetCache.targets[oldRef]) {
                _.remove(Game.TargetCache.targets[oldRef], name => name == this.name);
            }
        }
        // Set the new task
        this.memory.task = task ? task.proto : null;
        if (task) {
            if (task.target) {
                // Register task target in cache if it is actively targeting something (excludes goTo and similar)
                if (!Game.TargetCache.targets[task.target.ref]) {
                    Game.TargetCache.targets[task.target.ref] = [];
                }
                Game.TargetCache.targets[task.target.ref].push(this.name);
            }
            // Register references to creep
            task.bee = this;
        }
        // Clear cache
        this._task = null;
    }

    public get hasValidTask() {
        return this.task && this.task.isValid();
    }

    public get isIdle() {
        return !this.hasValidTask;
    }

    public travelState?: TravelState;

    public get hitsLost() {
        return this.hitsMax - this.hits;
    }

    public cancelOrder(methodName: string) {
        return this.creep.cancelOrder(methodName);
    }


    public drop(resourceType: ResourceConstant, amount?: number) {
        return this.creep.drop(resourceType, amount);
    }

    public dropAll() {
        for (const resourceType in this.store) {
            if (this.store.getUsedCapacity(resourceType as ResourceConstant)) {
                return this.drop(resourceType as ResourceConstant);
            }
        }
        return ERR_NOT_ENOUGH_RESOURCES;
    }


    public move(dirOrPos: DirectionConstant | RoomPosition) {
        if (typeof dirOrPos == 'number')
            return this.creep.move(dirOrPos);
        else return this.creep.move(this.creep.pos.getDirectionTo(dirOrPos));
    }

    public moveByPath(path: PathStep[] | RoomPosition[] | string) {
        return this.creep.moveByPath(path);
    }

    public travelTo(destination: HasPos | RoomPosition, ops?: TravelToOptions) {
        return Traveler.travelTo(this, destination, ops);
    }

    public notifyWhenAttacked(enabled: boolean) {
        if (this.setNotify === enabled) return OK;
        const code = this.creep.notifyWhenAttacked(enabled);
        if (code === OK) this.setNotify = enabled;
        return code;
    }

    public pickup(target: Resource) {
        return this.creep.pickup(target);
    }

    public say(message: string, toPublic?: boolean) {
        return this.creep.say(message, toPublic);
    }

    public suicide() {
        return this.creep.suicide();
    }

    public enableRoom(controller: StructureController) {
        return this.creep.enableRoom(controller);
    }

    public usePower(power: PowerConstant, target = undefined) {
        return this.creep.usePower(power, target);
    }

    public isAvailable(power: PowerConstant) {
        if (!this.creep.powers[power]) return ERR_INVALID_ARGS;
        else if (this.creep.powers[power].cooldown == undefined) return OK;
        return ERR_TIRED;
    }

    public transfer(target: AnyCreep | Structure, resourceType: ResourceConstant, amount?: number) {
        // 确定amount
        if (amount) {
            let free = 0;
            if (isStoreStructure(target)) free = getFreeCapacity(target.store, resourceType);
            amount = Math.min(this.creep.store.getUsedCapacity(resourceType), amount || Infinity, free);
            if (amount <= 0) return ERR_INVALID_ARGS;
        }
        return this.creep.transfer(target, resourceType, amount);
    }

    public withdraw(target: Structure | Tombstone | Ruin, resourceType: ResourceConstant, amount?: number) {
        // 确定amount
        if (amount) {
            let store = 0;
            if (isStoreStructure(target)) store = target.store.getUsedCapacity(resourceType);
            if (!store) return ERR_INVALID_TARGET;
            amount = Math.min(this.creep.store.getFreeCapacity(), amount || this.creep.store.getCapacity(), store);
            if (amount <= 0) return ERR_INVALID_ARGS;
        }
        return this.creep.withdraw(target, resourceType, amount);
    }

    // 另外添加的方法

    public travelToRoom(roomName: string, ops?: TravelToOptions) {
        return Traveler.travelToRoom(this, roomName, ops);
    }

    public moveOffExit() {
        Traveler.moveOffExit(this);
    }

    public lock() {
        this.locked = true;
    }

    public unlock() {
        this.locked = false;
    }

    public sleep(tick: number) {
        timer.callBackAtTick(timeAfterTick(tick), () => this.awake());
        this.slept = true;
    }

    public awake() {
        this.slept = false;
    }

    public run(): number | void {
        if (this.locked || this.slept) return;
        return this.runCore();
    }

    protected runCore(): number | void {
        if (this.task) return this.task.run();
    }

    public spawn(powerSpawn: StructurePowerSpawn) {
        return this.creep.spawn(powerSpawn);
    }

    public renewCreep(structure: StructurePowerSpawn | StructurePowerBank) {
        return this.creep.renew(structure);
    }

    get spawnCooldownTime() {
        return this.creep.spawnCooldownTime;
    }

    protected keepAlive() {

    }
}

(global as any).powerBees = powerBees;