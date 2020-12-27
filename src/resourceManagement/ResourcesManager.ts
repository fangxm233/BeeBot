import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { Bee } from 'Bee/Bee';
import { BeeBot } from 'BeeBot/BeeBot';
import { profile } from 'profiler/decorator';
import { withdrawTargetType } from 'tasks/instances/task_withdraw';
import { Task } from 'tasks/Task';
import { Tasks } from 'tasks/Tasks';

export const COMMODITIES = [
    RESOURCE_UTRIUM_BAR,
    RESOURCE_LEMERGIUM_BAR,
    RESOURCE_ZYNTHIUM_BAR,
    RESOURCE_KEANIUM_BAR,
    RESOURCE_GHODIUM_MELT,
    RESOURCE_OXIDANT,
    RESOURCE_REDUCTANT,
    RESOURCE_PURIFIER,
    RESOURCE_BATTERY,
    RESOURCE_COMPOSITE,
    RESOURCE_CRYSTAL,
    RESOURCE_LIQUID,
    RESOURCE_WIRE,
    RESOURCE_SWITCH,
    RESOURCE_TRANSISTOR,
    RESOURCE_MICROCHIP,
    RESOURCE_CIRCUIT,
    RESOURCE_DEVICE,
    RESOURCE_CELL,
    RESOURCE_PHLEGM,
    RESOURCE_TISSUE,
    RESOURCE_MUSCLE,
    RESOURCE_ORGANOID,
    RESOURCE_ORGANISM,
    RESOURCE_ALLOY,
    RESOURCE_TUBE,
    RESOURCE_FIXTURES,
    RESOURCE_FRAME,
    RESOURCE_HYDRAULICS,
    RESOURCE_MACHINE,
    RESOURCE_CONDENSATE,
    RESOURCE_CONCENTRATE,
    RESOURCE_EXTRACT,
    RESOURCE_SPIRIT,
    RESOURCE_EMANATION,
    RESOURCE_ESSENCE,
];

export const COMMODITIES_LEVEL_ZERO = [
    RESOURCE_WIRE,
    RESOURCE_CELL,
    RESOURCE_ALLOY,
    RESOURCE_CONDENSATE,
]

export const COMMODITIES_WITHOUT_COMPRESSED = [
    RESOURCE_COMPOSITE,
    RESOURCE_CRYSTAL,
    RESOURCE_LIQUID,
    RESOURCE_WIRE,
    RESOURCE_SWITCH,
    RESOURCE_TRANSISTOR,
    RESOURCE_MICROCHIP,
    RESOURCE_CIRCUIT,
    RESOURCE_DEVICE,
    RESOURCE_CELL,
    RESOURCE_PHLEGM,
    RESOURCE_TISSUE,
    RESOURCE_MUSCLE,
    RESOURCE_ORGANOID,
    RESOURCE_ORGANISM,
    RESOURCE_ALLOY,
    RESOURCE_TUBE,
    RESOURCE_FIXTURES,
    RESOURCE_FRAME,
    RESOURCE_HYDRAULICS,
    RESOURCE_MACHINE,
    RESOURCE_CONDENSATE,
    RESOURCE_CONCENTRATE,
    RESOURCE_EXTRACT,
    RESOURCE_SPIRIT,
    RESOURCE_EMANATION,
    RESOURCE_ESSENCE,
];

export const COMPRESSED_COMMODITIES: ResourceConstant[] = [
    RESOURCE_UTRIUM_BAR,
    RESOURCE_LEMERGIUM_BAR,
    RESOURCE_ZYNTHIUM_BAR,
    RESOURCE_KEANIUM_BAR,
    RESOURCE_GHODIUM_MELT,
    RESOURCE_OXIDANT,
    RESOURCE_REDUCTANT,
    RESOURCE_PURIFIER,
    RESOURCE_BATTERY,
];

export const DEPOSITS = [
    RESOURCE_METAL,
    RESOURCE_BIOMASS,
    RESOURCE_SILICON,
    RESOURCE_MIST,
]

export const MINERALS = [
    RESOURCE_OXYGEN,
    RESOURCE_HYDROGEN,
    RESOURCE_ZYNTHIUM,
    RESOURCE_LEMERGIUM,
    RESOURCE_UTRIUM,
    RESOURCE_KEANIUM,
    RESOURCE_CATALYST,
];

export const MINERAL_COMPOUNDS = Object.keys(REACTION_TIME) as MineralCompoundConstant[];

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

    RESOURCE_UTRIUM_LEMERGITE,
    RESOURCE_ZYNTHIUM_KEANITE,
    RESOURCE_HYDROXIDE,

    RESOURCE_GHODIUM,
    RESOURCE_CATALYST,
    RESOURCE_ZYNTHIUM,
    RESOURCE_LEMERGIUM,
    RESOURCE_KEANIUM,
    RESOURCE_UTRIUM,
    RESOURCE_OXYGEN,
    RESOURCE_HYDROGEN,

    RESOURCE_ENERGY,
].reverse();

@profile
export class ResourcesManager {


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