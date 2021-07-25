import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { Bee } from 'Bee/Bee';
import { BeeBot } from 'BeeBot/BeeBot';
import {
    COMMODITIES,
    COMMODITIES_LEVEL_ZERO,
    COMMODITIES_WITHOUT_COMPRESSED,
    COMPRESSED_COMMODITIES,
    DEPOSITS,
    MINERAL_COMPOUNDS,
    MINERALS,
} from 'declarations/resourcesMap';
import { profile } from 'profiler/decorator';
import { TerminalManager } from 'resourceManagement/TerminalManager';
import { withdrawTargetType } from 'tasks/instances/task_withdraw';
import { Task } from 'tasks/Task';
import { Tasks } from 'tasks/Tasks';

export const RESOURCE_IMPORTANCE: ResourceConstant[] = [
    ...[...COMMODITIES].reverse(),

    RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
    RESOURCE_CATALYZED_GHODIUM_ACID,
    RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
    RESOURCE_CATALYZED_ZYNTHIUM_ACID,
    RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
    RESOURCE_CATALYZED_LEMERGIUM_ACID,
    RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
    RESOURCE_CATALYZED_KEANIUM_ACID,
    RESOURCE_CATALYZED_UTRIUM_ALKALIDE,
    RESOURCE_CATALYZED_UTRIUM_ACID,

    RESOURCE_METAL,
    RESOURCE_BIOMASS,
    RESOURCE_SILICON,
    RESOURCE_MIST,

    RESOURCE_POWER,
    RESOURCE_OPS,

    RESOURCE_GHODIUM_ALKALIDE,
    RESOURCE_GHODIUM_ACID,
    RESOURCE_ZYNTHIUM_ALKALIDE,
    RESOURCE_ZYNTHIUM_ACID,
    RESOURCE_LEMERGIUM_ALKALIDE,
    RESOURCE_LEMERGIUM_ACID,
    RESOURCE_KEANIUM_ALKALIDE,
    RESOURCE_KEANIUM_ACID,
    RESOURCE_UTRIUM_ALKALIDE,
    RESOURCE_UTRIUM_ACID,

    RESOURCE_GHODIUM_OXIDE,
    RESOURCE_GHODIUM_HYDRIDE,
    RESOURCE_ZYNTHIUM_OXIDE,
    RESOURCE_ZYNTHIUM_HYDRIDE,
    RESOURCE_LEMERGIUM_OXIDE,
    RESOURCE_LEMERGIUM_HYDRIDE,
    RESOURCE_KEANIUM_OXIDE,
    RESOURCE_KEANIUM_HYDRIDE,
    RESOURCE_UTRIUM_OXIDE,
    RESOURCE_UTRIUM_HYDRIDE,

    RESOURCE_GHODIUM,

    RESOURCE_UTRIUM_LEMERGITE,
    RESOURCE_ZYNTHIUM_KEANITE,
    RESOURCE_HYDROXIDE,

    RESOURCE_CATALYST,
    RESOURCE_ZYNTHIUM,
    RESOURCE_LEMERGIUM,
    RESOURCE_KEANIUM,
    RESOURCE_UTRIUM,
    RESOURCE_OXYGEN,
    RESOURCE_HYDROGEN,

    RESOURCE_ENERGY,
].reverse();

export const STORAGE_EXCLUDED_COMPOUND: MineralCompoundConstant[] =
    [RESOURCE_ZYNTHIUM_KEANITE, RESOURCE_UTRIUM_LEMERGITE];

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
export const STORAGE_FULL_LINE = 950e3;

export const MAX_OPS = 50000;

@profile
export class ResourcesManager {

    private static resourceCursor = 0;
    private static readonly countPerTick = 4;
    private static extraResources: {resource: ResourceConstant, time: number}[] = [];
    private static readonly extraDuration = 100;

    public static balanceResources() {
        const rooms = BeeBot.colonies().filter(room => !!room.terminal && room.terminal.my
            && !TerminalManager.hasOutgoingTransport(room.name) && !TerminalManager.hasIncomingTransport(room.name));
        if (rooms.length < 2) return;

        const resourceToDeal = this.extraResources.map(r => r.resource);
        for (let i = 0; i < this.countPerTick; i++) {
            if(this.resourceCursor >= RESOURCES_ALL.length) this.resourceCursor = 0;
            resourceToDeal.push(RESOURCES_ALL[this.resourceCursor]);
            this.resourceCursor++;
        }

        resourceToDeal.forEach(resourceType => {
            if (rooms.length < 2) return;
            const min = this.getResourceMinimum(resourceType, 'all');
            const max = this.getResourceLimit(resourceType, 'all');
            const lacks = rooms.filter(room => this.getStock(room.name, resourceType) < min);
            const extra = rooms.filter(room => this.getStock(room.name, resourceType) > max);
            const normal = rooms.filter(room => this.getStock(room.name, resourceType) >= min && this.getStock(room.name, resourceType) <= max);

            if (lacks.length && normal.length && extra.length) {
                lacks.forEach(room => {
                    if (!normal.length && !extra.length) return;
                    const remain = min - this.getStock(room.name, resourceType);
                    const source = _.max([...normal, ...extra], room => this.getStock(room.name, resourceType));
                    const amount = Math.min(remain, this.getStock(source.name, resourceType) - min);
                    if (amount <= 0) return;
                    TerminalManager.setTransport(source.name, room.name, resourceType, amount);
                    this.addExtraResource(resourceType);
                    _.remove(normal, room => TerminalManager.hasOutgoingTransport(room.name));
                    _.remove(extra, room => TerminalManager.hasOutgoingTransport(room.name));
                });
            }

            if (extra.length && normal.length) {
                extra.forEach(room => {
                    if (!normal.length) return;
                    const remain = this.getStock(room.name, resourceType) - max;
                    const to = _.min(normal, room => this.getStock(room.name, resourceType));
                    const amount = Math.min(remain, max - this.getStock(to.name, resourceType));
                    if (amount <= 0) return;
                    TerminalManager.setTransport(room.name, to.name, resourceType, amount);
                    this.addExtraResource(resourceType);
                    _.remove(normal, room => TerminalManager.hasOutgoingTransport(room.name));
                });
            }

            _.remove(rooms, room => TerminalManager.hasOutgoingTransport(room.name)
                || TerminalManager.hasIncomingTransport(room.name));
        });

        _.remove(this.extraResources, r => Game.time - r.time >= this.extraDuration);
    }

    public static addExtraResource(resource: ResourceConstant) {
        const exists = this.extraResources.find(r => r.resource == resource);
        if(exists) {
            exists.time = Game.time;
            return;
        }
        this.extraResources.push({resource, time: Game.time});
    }

    public static getStock(roomName: string, resource: ResourceConstant, factory: boolean = false): number {
        let stock = 0;
        const room = Game.rooms[roomName];
        if (!room) return stock;

        stock += room.storage?.store.getUsedCapacity(resource) || 0;
        stock += room.terminal?.store.getUsedCapacity(resource) || 0;
        if (factory) stock += room.factory?.store.getUsedCapacity(resource) || 0;

        return stock;
    }

    private static resourceLimitCache: { [resource: string]: number } = {};

    public static getResourceLimit(resource: ResourceConstant, container: 'terminal' | 'storage' | 'all'): number {
        const key = `${resource}_${container}`;
        if (this.resourceLimitCache[key] !== undefined)
            return this.resourceLimitCache[key];

        if (container == 'all')
            return this.resourceLimitCache[key] =
                this.getResourceLimit(resource, 'terminal') + this.getResourceLimit(resource, 'storage');

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
            else limit = TERMINAL_MINERAL + TERMINAL_MINERAL_FLOAT;
        } else if (_.contains(MINERAL_COMPOUNDS, resource)) {
            if (container == 'terminal') limit = TERMINAL_COMPOUND;
            else if (_.contains(STORAGE_EXCLUDED_COMPOUND, resource)) limit = 0;
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

    private static resourceMinimumCache: { [resource: string]: number } = {};

    public static getResourceMinimum(resource: ResourceConstant, container: 'terminal' | 'storage' | 'all'): number {
        const key = `${resource}_${container}`;
        if (this.resourceMinimumCache[key] !== undefined)
            return this.resourceMinimumCache[key];

        if (container == 'all')
            return this.resourceMinimumCache[key] =
                this.getResourceMinimum(resource, 'terminal') + this.getResourceMinimum(resource, 'storage');

        let min = 0;

        if (resource == RESOURCE_ENERGY) {
            if (container == 'storage') min = STORAGE_ENERGY_BOTTOM;
            else min = TERMINAL_ENERGY - TERMINAL_ENERGY_FLOAT;
        } else if (_.contains(MINERALS, resource)) {
            if (container == 'terminal') min = TERMINAL_MINERAL - TERMINAL_MINERAL_FLOAT;
        } else if (_.contains(MINERAL_COMPOUNDS, resource)) {
            if (container == 'terminal') min = TERMINAL_COMPOUND;
        }

        return this.resourceMinimumCache[`${resource}_${container}`] = min;
    }

    public static getEnergySource(bee: Bee, isFiller: boolean, minAmount?: number): Task | null {
        const early = BeeBot.getColonyStage(bee.room.name) == 'early';
        const remain = minAmount === undefined ? bee.store.getFreeCapacity() * 0.5 : minAmount;

        let candidates: (withdrawTargetType | Resource)[] =
            bee.room.tombstones.filter(tomb => tomb.store.energy >= remain);
        candidates.push(...bee.room.droppedEnergy.filter(energy => energy.amount > remain));
        candidates.push(...bee.room.ruins.filter(ruin => ruin.store.energy >= remain));
        if (early) {
            BeeBot.getEarlyOutposts(bee.process.roomName).forEach(roomName => {
                const room = Game.rooms[roomName];
                if (!room) return;
                candidates.push(...room.droppedEnergy.filter(energy => energy.amount > remain));
            });
        }

        if (bee.room.storage) {
            if (bee.room.storage.energy >= remain) candidates.push(bee.room.storage);
        }
        if (bee.room.terminal) {
            if (bee.room.terminal.energy >= remain) candidates.push(bee.room.terminal);
        }

        candidates.push(...bee.room.containers.filter(
            container => container.store.energy >= remain
                && (isFiller || !RoomPlanner.isFillerContainer(container.pos))));
        candidates.push(...bee.room.links.filter(link => link.store.energy >= remain));

        const spawnRoom = Game.rooms[bee.process.roomName];
        if (spawnRoom?.storage && spawnRoom.storage.store.energy >= remain) {
            candidates.push(spawnRoom.storage);
        }

        candidates = candidates.filter(structure => {
            function getOrdered(target: withdrawTargetType | Resource) {
                return _.sum(target.targetedBy, creep => creep.store.getFreeCapacity());
            }

            if (structure instanceof Resource) return structure.amount > getOrdered(structure);
            return structure.store.energy >= getOrdered(structure);
        });

        if (candidates.length) {
            const target = bee.pos.findClosestByMultiRoomRange(candidates);
            if (target instanceof Resource) {
                return Tasks.pickup(target);
            } else if (target) {
                return Tasks.withdraw(target, RESOURCE_ENERGY);
            }
        }
        return null;
    }
}