import { Bee } from 'Bee/Bee';
import { log } from 'console/log';
import { StoreStructure } from 'declarations/typeGuards';
import { profile } from 'profiler/decorator';
import {
    COMPRESSED_COMMODITIES,
    MINERAL_COMPOUNDS,
    MINERALS,
    RESOURCE_IMPORTANCE,
    ResourcesManager,
    STORAGE_ENERGY_BOTTOM,
    STORAGE_FULL_LINE,
    TERMINAL_COMPOUND,
    TERMINAL_ENERGY,
    TERMINAL_ENERGY_FLOAT,
    TERMINAL_FULL_LINE,
    TERMINAL_MINERAL,
    TERMINAL_MINERAL_FLOAT,
} from 'resourceManagement/ResourcesManager';
import { TerminalManager } from 'resourceManagement/TerminalManager';

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

            if (!this.nowFunc) {
                const functions = [this.runLink, this.runManageStock, this.runConsumeExtra, this.runTransport];

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
        if (Game.time % 20 == 0 && !this.nowFunc) return false;
        if (this.storage.store.getUsedCapacity() < STORAGE_FULL_LINE
            && this.terminal?.store.getUsedCapacity() < TERMINAL_FULL_LINE) return false;
        return RESOURCE_IMPORTANCE.some(type => {
            if (this.store.getUsedCapacity(type)) {
                this.drop(type);
                return true;
            }

            if (this.storage.store.getUsedCapacity() > STORAGE_FULL_LINE) {
                const storageLimit = ResourcesManager.getResourceLimit(type, 'storage');
                if (this.storage.store.getUsedCapacity(type) > storageLimit) {
                    this.get(this.storage, type, storageLimit - this.storage.store.getUsedCapacity(type));
                    return true;
                }
            }

            if (!this.terminal) return false;
            if (this.terminal.store.getUsedCapacity() < TERMINAL_FULL_LINE) return false;
            const terminalLimit = ResourcesManager.getResourceLimit(type, 'terminal');
            if (this.terminal.store.getUsedCapacity(type) > terminalLimit) {
                this.get(this.terminal, type, terminalLimit - this.terminal.store.getUsedCapacity(type));
                return true;
            }

            return false;
        });
    }

    private runManageStock(): boolean {
        if (Game.time % 10 == 0 && !this.nowFunc) return false;
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
                        Math.min(min - terminalStored, storageStored - bottom), type);
                    return true;
                }
            }

            if (terminalStored > max) {
                if (this.storage.isFull) return false;
                this.setTask(this.terminal, this.storage, terminalStored - max, type);
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
                this.setTask(this.storage, this.terminal, TERMINAL_COMPOUND - amount, type);
                return true;
            }

            if (amount > TERMINAL_COMPOUND) {
                if (type == RESOURCE_HYDROXIDE || type == RESOURCE_ZYNTHIUM_KEANITE
                    || type == RESOURCE_UTRIUM_LEMERGITE) return false;
                if (this.storage.isFull) return false;
                this.setTask(this.terminal, this.storage, amount - TERMINAL_COMPOUND, type);
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

    private runTransport(): boolean {
        if (!this.terminal) return false;
        const transport = TerminalManager.getTransport(this.room.name);
        if (!transport) return false;

        const des = Game.rooms[transport.des];
        if (des && (!des.terminal || !des.terminal.store.getFreeCapacity())) {
            TerminalManager.clearTransport(this.room.name);
            return false;
        }

        // 将已经存在的货物和能量剔除，分配剩余空间
        const energyStored = this.terminal.store.getUsedCapacity(RESOURCE_ENERGY);
        const stored = this.terminal.store.getUsedCapacity(transport.type);
        const free = this.terminal.store.getFreeCapacity()
            + stored + (transport.type == RESOURCE_ENERGY ? 0 : energyStored);
        let amount = Math.min(transport.amount,
            ResourcesManager.getStock(this.room.name, transport.type), free);
        let cost = Game.market.calcTransactionCost(amount, this.room.name, transport.des);
        if (cost + amount > free) amount = free - cost;

        cost = Game.market.calcTransactionCost(amount, this.room.name, transport.des);
        if (!this.terminal.cooldown && this.terminal.store.energy >= cost
            && this.terminal.store[transport.type] >= (transport.type == RESOURCE_ENERGY ? amount + cost : amount)) {
            this.terminal.send(transport.type, amount, transport.des);
            transport.amount -= amount;
            if (transport.amount <= 0) TerminalManager.clearTransport(this.room.name);
            return true;
        }

        const resourceRemain = Math.max(0, amount + (transport.type == RESOURCE_ENERGY ? cost : 0) - stored);
        const energyRemain = transport.type == RESOURCE_ENERGY ? 0 : Math.max(0, cost - energyStored);

        const freeCapacity = this.terminal.store.getFreeCapacity();
        if (freeCapacity >= resourceRemain + energyRemain) {
            if (resourceRemain) {
                if(!this.storage.store.getUsedCapacity(transport.type)) {
                    TerminalManager.clearTransport(this.room.name);
                    return false;
                }
                this.setTask(this.storage, this.terminal, resourceRemain, transport.type);
            }
            else {
                if(!this.storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
                    TerminalManager.clearTransport(this.room.name);
                    return false;
                }
                this.setTask(this.storage, this.terminal, energyRemain);
            }
            return true;
        }

        if (resourceRemain && energyRemain) {
            log.warning(`Wrong calculation! ${JSON.stringify(transport)}, resourceRemain: ${resourceRemain}, energyRemain: ${energyRemain}`);
            return true;
        }

        // 由于总数相加小于等于空闲空间，此时一定是一多一少，如果运输的是能量，不可能到这一步
        if (this.storage.isFull) return false;
        if (resourceRemain) this.setTask(this.terminal, this.storage, resourceRemain - freeCapacity);
        else this.setTask(this.terminal, this.storage, energyRemain - freeCapacity, transport.type);

        return true;
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