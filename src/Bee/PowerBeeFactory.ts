import { PowerBee } from 'Bee/PowerBee';
import { PriorityManager } from 'beeSpawning/PriorityManager';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';

@profile
export class PowerBeeFactory {
    private static beeRegistry: {
        role: ALL_ROLES,
        constructor: typeof PowerBee,
    }[] = [];

    private static role2Priority: { [role: string]: number } = {};

    public static registerBee(role: ALL_ROLES, constructor: typeof PowerBee) {
        PriorityManager.setDefaultPriority(role, this.beeRegistry.length);
        this.beeRegistry.push({ role, constructor });
    }

    public static getInstance<T extends PowerBee>(role: ALL_ROLES, process: Process, creepName?: string): T {
        // 获取creep实例，不进行空值检查
        const creep = Game.powerCreeps[creepName!];
        const registration = this.beeRegistry.find(r => r.role == role);

        if (registration) return new registration.constructor(role, process, creep) as any;
        throw new Error(`The role ${role} haven't been registered.`);
    }
}

(global as any).PowerBeeFactory = PowerBeeFactory;