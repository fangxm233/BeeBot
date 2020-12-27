import { Bee } from 'Bee/Bee';
import { StoreStructure } from 'declarations/typeGuards';
import { profile } from 'profiler/decorator';
import {
    COMMODITIES_LEVEL_ZERO,
    COMMODITIES_WITHOUT_COMPRESSED,
    COMPRESSED_COMMODITIES,
    DEPOSITS,
    MINERAL_COMPOUNDS,
    MINERALS,
    RESOURCE_IMPORTANCE,
} from 'resourceManagement/ResourcesManager';
import { log } from 'console/log';

export const STORAGE_ENERGY_BOTTOM = 10e3;
export const STORAGE_ENERGY = 400e3;
export const TERMINAL_ENERGY = 20e3;
export const TERMINAL_ENERGY_FLOAT = 5e3;

export const STORAGE_COMPOUND = 30e3;
export const TERMINAL_COMPOUND = 3e3;

export const STORAGE_MINERAL = 5e3;
export const TERMINAL_MINERAL = 5e3;
export const TERMINAL_MINERAL_FLOAT = 1e3;

export const TERMINAL_POWER = 30e3;
export const STORAGE_OPS = 30e3;

export const STORAGE_COMPRESSED_COMMODITIES = 5e3;
export const TERMINAL_COMMODITY_ZERO = 10e3;
export const TERMINAL_COMMODITY = 500;
export const TERMINAL_DEPOSIT = 10e3;

export const TERMINAL_FULL_LINE = 295e3;
export const STORAGE_FULL_LINE = 900e3;

@profile
export class BeeManager extends Bee {
    private centerLinkId: Id<StructureLink>;
    private upgradeLinkId: Id<StructureLink>;
    private initialized: boolean;

    private storage: StructureStorage;
    private terminal: StructureTerminal;

    private nowFunc: () => boolean;
    private transferTask?: {
        from: Id<StoreStructure>, to: Id<StoreStructure>,
        type: ResourceConstant, amount: number, drop?: boolean
    };

    public runCore() {
        this.arriveTick = 1;

        this.storage = this.room.storage!;
        this.terminal = this.room.terminal!;
        if (!this.storage) return;

        if (!this.initialized && !this.init()) return;

        if (!this.transferTask) {
            if (this.nowFunc) {
                const code = this.nowFunc();
                if (!code) {
                    this.nowFunc = undefined as unknown as any;
                }
            }

            if(!this.nowFunc) {
                const functions = [this.runLink, this.runManageStock, this.runConsumeExtra];

                functions.forEach(func => {
                    const code = func.apply(this);
                    if (code) {
                        this.nowFunc = func;
                        return;
                    }
                });
            }
        }

        this.executeTask();
    }

    private init(): boolean {
        const controller = this.room.controller!;

        if (!this.centerLinkId)
            this.centerLinkId = this.room.links.filter(link => link.pos.inRangeTo(this.storage, 2))[0]?.id!;
        if (!this.upgradeLinkId)
            this.upgradeLinkId = this.room.links.filter(link => link.pos.inRangeTo(controller, 2))[0]?.id!;

        return true;
    }

    private executeTask() {
        if (!this.transferTask) return;
        const task = this.transferTask;
        const stored = this.store.getUsedCapacity(task.type);
        if (stored) {
            const to = Game.getObjectById(task.to);
            if (to) {
                if (!to.store.getFreeCapacity()) {
                    if (task.drop) this.drop(task.type);
                    this.clearTask();
                }
                this.transferTo(to, task.type);
            } else this.clearTask();
            task.amount -= stored;
            if (task.amount <= 0) this.clearTask();
            return;
        }
        const from = Game.getObjectById(task.from);
        if (from && from.store.getUsedCapacity(task.type))
            this.get(from, task.type, task.amount);
        else this.clearTask();
    }

    private setTask(from: Id<StoreStructure> | StoreStructure, to: Id<StoreStructure> | StoreStructure
        , amount?: number, type: ResourceConstant = RESOURCE_ENERGY, drop: boolean = false) {
        if (from instanceof Structure) from = from.id;
        if (to instanceof Structure) to = to.id;
        if (amount === undefined) amount = Game.getObjectById(from)?.store.getUsedCapacity(type) || 0;
        if (amount <= 0) return;
        this.transferTask = { from, to, type, amount, drop };
    }

    private clearTask() {
        this.transferTask = undefined;
    }

    private runLink(): boolean {
        const centerLink = Game.getObjectById(this.centerLinkId);
        if (centerLink) {
            const upgradeLink = Game.getObjectById(this.upgradeLinkId);
            if (upgradeLink && upgradeLink.store.energy < 600) {
                const remain = upgradeLink.store.getFreeCapacity(RESOURCE_ENERGY) - centerLink.store.energy;
                if (remain <= 0) {
                    return centerLink.transferEnergy(upgradeLink) != OK;
                }
                this.setTask(this.storage, centerLink, remain);
                return true;
            }
            if (centerLink && centerLink.store.energy) {
                this.setTask(centerLink, this.storage);
                return true;
            }
        }
        return false;
    }

    private runConsumeExtra(): boolean {
        if(Game.time % 20 == 0 && !this.nowFunc) return false;
        if (this.storage.store.getUsedCapacity() < STORAGE_FULL_LINE
            && this.terminal.store.getUsedCapacity() < TERMINAL_FULL_LINE) return false;
        return RESOURCE_IMPORTANCE.some(type => {
            if (this.store.getUsedCapacity(type)) {
                this.drop(type);
                return true;
            }

            if (this.storage.store.getUsedCapacity() > STORAGE_FULL_LINE) {
                const storageLimit = this.getResourceLimit(type, 'storage');
                if (this.storage.store.getUsedCapacity(type) > storageLimit) {
                    this.get(this.storage, type, storageLimit - this.storage.store.getUsedCapacity(type));
                    return true;
                }
            }

            if (!this.terminal) return false;
            if (this.terminal.store.getUsedCapacity() < TERMINAL_FULL_LINE) return false;
            const terminalLimit = this.getResourceLimit(type, 'terminal');
            if (this.terminal.store.getUsedCapacity(type) > terminalLimit) {
                this.get(this.terminal, type, terminalLimit - this.terminal.store.getUsedCapacity(type));
                return true;
            }

            return false;
        });
    }

    private resourceLimitCache: { [resource: string]: number } = {};

    private getResourceLimit(resource: ResourceConstant, container: 'terminal' | 'storage'): number {
        if (this.resourceLimitCache[`${resource}_${container}`])
            return this.resourceLimitCache[`${resource}_${container}`];

        let limit = 0;

        if (resource == RESOURCE_ENERGY) {
            if (container == 'storage') limit = STORAGE_ENERGY;
            else limit = TERMINAL_ENERGY + TERMINAL_ENERGY_FLOAT;
        } else if (resource == RESOURCE_POWER) {
            if (container == 'terminal') limit = TERMINAL_POWER;
            else limit = 0;
        } else if (resource == RESOURCE_OPS) {
            if (container == 'storage') limit = STORAGE_OPS;
            else limit = 0;
        } else if (_.contains(MINERALS, resource)) {
            if (container == 'storage') limit = STORAGE_MINERAL;
            else limit = TERMINAL_MINERAL;
        } else if (_.contains(MINERAL_COMPOUNDS, resource)) {
            if (container == 'terminal') limit = TERMINAL_COMPOUND;
            else if (resource == RESOURCE_HYDROXIDE || resource == RESOURCE_ZYNTHIUM_KEANITE
                || resource == RESOURCE_UTRIUM_LEMERGITE)
                limit = 0;
            else limit = STORAGE_COMPOUND;
        } else if (_.contains(COMPRESSED_COMMODITIES, resource)) {
            if (container == 'storage') limit = STORAGE_COMPRESSED_COMMODITIES;
            else limit = 0;
        } else if (_.contains(COMMODITIES_LEVEL_ZERO, resource)) {
            if (container == 'terminal') limit = TERMINAL_COMMODITY_ZERO;
            else limit = 0;
        } else if (_.contains(COMMODITIES_WITHOUT_COMPRESSED, resource)) {
            if (container == 'terminal') limit = TERMINAL_COMMODITY;
            else limit = 0;
        } else if (_.contains(DEPOSITS, resource)) {
            if (container == 'terminal') limit = TERMINAL_DEPOSIT;
            else limit = 0;
        }

        return this.resourceLimitCache[`${resource}_${container}`] = limit;
    }

    private runManageStock(): boolean {
        if(Game.time % 10 == 0 && !this.nowFunc) return false;
        if (!this.terminal) return false;

        let code = [RESOURCE_ENERGY, ...MINERALS].some(type => {
            const min = type == RESOURCE_ENERGY ? TERMINAL_ENERGY - TERMINAL_ENERGY_FLOAT
                : TERMINAL_MINERAL - TERMINAL_MINERAL_FLOAT;
            const max = type == RESOURCE_ENERGY ? TERMINAL_ENERGY + TERMINAL_ENERGY_FLOAT
                : TERMINAL_MINERAL + TERMINAL_MINERAL_FLOAT;
            const bottom = type == RESOURCE_ENERGY ? STORAGE_ENERGY_BOTTOM : 0;
            const storageStored = this.storage.store.getUsedCapacity(type);
            const terminalStored = this.terminal.store.getUsedCapacity(type);

            if (terminalStored < min) {
                if (this.terminal.isFull) return false;
                if (storageStored > bottom) {
                    this.setTask(this.storage, this.terminal,
                        Math.min(min - terminalStored, storageStored - bottom));
                    return true;
                }
            }

            if (terminalStored > max) {
                if (this.storage.isFull) return false;
                this.setTask(this.terminal, this.storage, terminalStored - max);
                return true;
            }

            return false;
        });
        if (code) return true;

        code = MINERAL_COMPOUNDS.some(type => {
            const amount = this.terminal.store.getUsedCapacity(type);
            if (amount < TERMINAL_COMPOUND) {
                if (this.terminal.isFull) return false;
                if (!this.storage.store.getUsedCapacity(type)) return false;
                this.setTask(this.storage, this.terminal, TERMINAL_COMPOUND - amount);
                return true;
            }

            if (amount > TERMINAL_COMPOUND) {
                if (type == RESOURCE_HYDROXIDE || type == RESOURCE_ZYNTHIUM_KEANITE
                    || type == RESOURCE_UTRIUM_LEMERGITE) return false;
                if (this.storage.isFull) return false;
                this.setTask(this.terminal, this.storage, amount - TERMINAL_COMPOUND);
                return true;
            }

            return false;
        });
        if (code) return true;

        code = [...COMPRESSED_COMMODITIES, RESOURCE_OPS].some(type => {
            if (this.storage.isFull) return false;
            if (this.terminal.store.getUsedCapacity(type)) {
                this.setTask(this.terminal, this.storage, undefined, type);
                return true;
            }
            return false;
        });

        return code;
    }

    private getEnergy(target: Structure, amount?: number) {
        if (!this.pos.isNearTo(target)) this.travelTo(target);
        else this.withdraw(target, RESOURCE_ENERGY, amount);
    }

    private transferEnergy(target: Structure, amount?: number) {
        if (!this.pos.isNearTo(target)) this.travelTo(target);
        else this.transfer(target, RESOURCE_ENERGY, amount);
    }

    private get(target: Structure, type: ResourceConstant, amount?: number) {
        if (!this.pos.isNearTo(target)) this.travelTo(target);
        else this.withdraw(target, type, amount);
    }

    private transferTo(target: Structure, type: ResourceConstant, amount?: number) {
        if (!this.pos.isNearTo(target)) this.travelTo(target);
        else this.transfer(target, type, amount);
    }
}