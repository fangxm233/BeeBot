import { PriorityManager } from "beeSpawning/PriorityManager";
import { Process } from "process/Process";
import { profile } from "profiler/decorator";
import { Bee } from "./Bee";

export const ROLE_FILLER = 'filler';
export const ROLE_MINER = 'miner';
export const ROLE_UPGRADER = 'upgrader';
export const ROLE_CARRIER = 'carrier';
export const ROLE_WORKER = 'worker';
export const ROLE_MANAGER = 'manager';
export const ROLE_SCOUT = 'scout';

@profile
export class BeeFactorty {
    private static beeRegistry: {
        role: ALL_ROLES,
        constructor: typeof Bee,
    }[] = [];

    private static role2Priority: { [role: string]: number } = {};

    public static registerBee(role: ALL_ROLES, constructor: typeof Bee) {
        PriorityManager.setDefaultPriority(role, this.beeRegistry.length);
        this.beeRegistry.push({ role, constructor });
    }

    public static getInstance<T extends Bee>(role: ALL_ROLES, process: Process, creepName?: string): T {
        // 获取creep实例，不进行空值检查
        const creep = Game.creeps[creepName!];
        const registration = this.beeRegistry.find(r => r.role == role);

        if (registration) return new registration.constructor(role, process, creep) as any;
        throw new Error(`The role ${role} haven't been registered.`);
    }
}