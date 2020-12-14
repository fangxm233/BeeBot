import { TargetCache } from 'caching/caching';
import { USER_NAME } from 'config';
import { Intel } from 'dataManagement/Intel';
import { isStoreStructure } from 'declarations/typeGuards';
import { event } from 'event/Event';
import { timer } from 'event/Timer';
import { Traveler } from 'movement/Traveler';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import { ITask } from 'tasks';
import { initializeTask } from 'tasks/initializer';
import { getFreeCapacity, timeAfterTick } from 'utilities/helpers';

export const bees: { [beeName: string]: Bee } = {};

export function toBee(creep: Creep | string): Bee | undefined {
    if (typeof creep == 'string') return bees[creep];
    return bees[creep.name];
}

/**
 * Bee是一个creep的包装，负责creep的任务生成和执行，封装了creep的所有动作和属性。是其他职能Bee的父类。
 */
@profile
export class Bee {
    public role: ALL_ROLES; // bee的角色
    public process: Process; // 管理他的process
    public creep: Creep; // 管理的creep

    public notify: boolean;

    public locked: boolean = false;
    public slept: boolean = false;
    public cyclingCallbackId: string;

    private settedNotify: boolean = true;

    constructor(role: ALL_ROLES, process: Process, creep?: Creep, notify: boolean = true) {
        this.role = role;
        this.creep = creep as Creep;
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

    public get room(): Room {
        return this.creep.room;
    }

    public get body(): BodyPartDefinition[] {
        return this.creep.body;
    }

    public get fatigue(): number {
        return this.creep.fatigue;
    }

    public get hits(): number {
        return this.creep.hits;
    }

    public get hitsMax(): number {
        return this.creep.hitsMax;
    }

    public get id(): Id<Creep> {
        return this.creep.id;
    }

    public get memory(): CreepMemory {
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

    public get spawning(): boolean {
        return this.creep.spawning;
    }

    public get store(): StoreDefinition {
        return this.creep.store;
    }

    public get ticksToLive(): number {
        return this.creep.ticksToLive || this.lifeTime;
    }

    // 另外添加的属性

    public get arriveTick(): number {
        return this.memory.AT || 0;
    }

    public set arriveTick(tick: number) {
        this.memory.AT = tick;
    }

    private _lifeTime: number;
    public get lifeTime(): number {
        if (this._lifeTime) return this._lifeTime;
        return this._lifeTime = this.bodyCounts[CLAIM] ? CREEP_CLAIM_LIFE_TIME : CREEP_LIFE_TIME;
    }

    private _bodyCounts: { [bodyType: string]: number };
    public get bodyCounts(): { [bodyType: string]: number } {
        if (this._bodyCounts) return this._bodyCounts;
        return this._bodyCounts = _.countBy(this.body, bodyPart => bodyPart.type);
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

    // creep的动作

    public attack(target: AnyCreep | Structure) {
        // 如果不是邻近则替换成远程
        if (this.creep.pos.isNearTo(target)) return this.creep.attack(target);
        else if (this.bodyCounts[RANGED_ATTACK]) return this.rangedAttack(target);
        return ERR_NOT_IN_RANGE;
    }

    public attackController(target: StructureController) {
        return this.creep.attackController(target);
    }

    public build(target: ConstructionSite) {
        if ((target as any)._arrangedCallback) return this.creep.build(target);
        (target as any)._arrangedCallback = true;
        timer.callBackAtTick(timeAfterTick(1), () => {
            if (Game.getObjectById(target.id)) return;
            if (!target.pos.lookForStructure(target.structureType)) return;
            event.invokeEvent('onBuildComplete', { pos: target.pos, type: target.structureType });
        });
        return this.creep.build(target);
    }

    public cancelOrder(methodName: string) {
        return this.creep.cancelOrder(methodName);
    }

    public claimController(target: StructureController) {
        return this.creep.claimController(target);
    }

    public dismantle(target: Structure) {
        return this.creep.dismantle(target);
    }

    public drop(resourceType: ResourceConstant, amount?: number) {
        return this.creep.drop(resourceType, amount);
    }

    public generateSafeMode(controller: StructureController) {
        return this.creep.generateSafeMode(controller);
    }

    public getActiveBodyparts(type: BodyPartConstant) {
        return this.creep.getActiveBodyparts(type);
    }

    public harvest(target: Source | Mineral | Deposit) {
        return this.creep.harvest(target);
    }

    public heal(target: AnyCreep) {
        // 如果不是邻近则替换成远程
        if (this.creep.pos.isNearTo(target))
            return this.creep.heal(target);
        else return this.rangedHeal(target);
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
        if (this.settedNotify === enabled) return OK;
        const code = this.creep.notifyWhenAttacked(enabled);
        if (code === OK) this.settedNotify = enabled;
        return code;
    }

    public pickup(target: Resource) {
        return this.creep.pickup(target);
    }

    public pull(target: Creep) {
        return this.creep.pull(target);
    }

    public rangedAttack(target: AnyCreep | Structure) {
        return this.creep.rangedAttack(target);
    }

    public rangedHeal(target: AnyCreep) {
        return this.creep.rangedHeal(target);
    }

    public rangedMassAttack() {
        return this.creep.rangedMassAttack();
    }

    public repair(target: Structure) {
        return this.creep.repair(target);
    }

    public reserveController(target: StructureController) {
        return this.creep.reserveController(target);
    }

    public say(message: string, toPublic?: boolean) {
        return this.creep.say(message, toPublic);
    }

    public signController(target: StructureController, text: string) {
        // 忽略无用sign
        if (!target.sign) return this.creep.signController(target, text);
        if (target.sign.username !== USER_NAME) return this.creep.signController(target, text);
        if (target.sign.text !== text) return this.creep.signController(target, text);
        return OK;
    }

    public suicide() {
        if (this.spawning) {
            timer.callBackAtTick(timeAfterTick(10), () => this.suicide());
            return ERR_BUSY;
        }
        return this.creep.suicide();
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

    public upgradeController(target: StructureController) {
        if ((target as any)._arrangedCallback) return this.creep.upgradeController(target);
        (target as any)._arrangedCallback = true;
        timer.callBackAtTick(timeAfterTick(1), () => {
            if (Game.getObjectById(target.id)!.level > target.level) {
                Intel.refreshRoomIntel(target.room.name);
                event.invokeEvent('onRclUpgrade');
            }
        });
        return this.creep.upgradeController(target);
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
}

(global as any).bees = bees;