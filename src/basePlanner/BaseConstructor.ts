import { USER_NAME } from "config";
import { log } from "console/log";
import { isStoreStructure } from "declarations/typeGuards";
import { clock } from "event/Clock";
import { event } from "event/Event";
import { timer } from "event/Timer";
import { profile } from "profiler/decorator";
import { isOwner, timeAfterTick } from "utilities/helpers";
import { printRoomName } from "utilities/utils";
import { RoomPlanner } from "./RoomPlanner";
import { extConstructOrder, structureLayout } from "./structurePreset";

const constructOrder: StructureConstant[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_ROAD,
    STRUCTURE_TOWER,
    STRUCTURE_EXTENSION,
    STRUCTURE_CONTAINER,
    STRUCTURE_STORAGE,
    STRUCTURE_LINK,
    STRUCTURE_TERMINAL,
    STRUCTURE_LAB,
    STRUCTURE_OBSERVER,
    STRUCTURE_FACTORY,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_NUKER
];

export const ROAD_CONSTRUCT_RCL = 4;

@profile
export class BaseConstructor {
    private static constructors: { [roomName: string]: BaseConstructor } = {};

    private roomName: string;
    private base: Coord;
    private filteredExtConstructingOrder: RoomPosition[];
    private finishedRcl: number = 0;;

    constructor(roomName: string) {
        this.roomName = roomName;
        const data = RoomPlanner.getRoomData(roomName);
        const terrain = Game.map.getRoomTerrain(roomName);
        if (!data) {
            log.warning(`RoomData of ${printRoomName(this.roomName)} does not exists! replaning...`);
            RoomPlanner.planRoom(this.roomName, undefined, true);
            return;
        }

        this.base = data.basePos!;
        this.filteredExtConstructingOrder = extConstructOrder.filter(
            coord => terrain.get(data.basePos!.x + coord.x, data.basePos!.y + coord.y) != TERRAIN_MASK_WALL)
            .map(coord => new RoomPosition(data.basePos!.x + coord.x, data.basePos!.y + coord.y, roomName));

        BaseConstructor.constructors[roomName] = this;
        event.addEventListener('onBuildComplete', () => this.constructBuildings());
        // 等待RoomData更新
        event.addEventListener('onRclUpgrade',
            () => timer.callBackAtTick(timeAfterTick(1), () => this.constructBuildings()));
        clock.addAction(100, () => this.constructBuildings());
    }

    public static get(roomName: string): BaseConstructor {
        if (this.constructors[roomName]) return this.constructors[roomName];
        return this.constructors[roomName] = new BaseConstructor(roomName);
    }

    public constructBuildings() {
        const room = Game.rooms[this.roomName];
        const controller = room?.controller;
        if (!controller) return;
        if (room.constructionSites.length) return;

        const rcl = controller.level;
        if (this.finishedRcl < rcl) {
            for (let i = this.finishedRcl + 1; i <= rcl; i++) {
                if (this.finishedBuildingsAtRcl(i)) this.finishedRcl = i;
            }
        } else if (!this.finishedBuildingsAtRcl(rcl)) this.finishedRcl--;
        if (this.finishedRcl == rcl) return;

        const checkAndConstructMissing = (coords: Coord[], type: StructureConstant, transforn: boolean) => {
            const missing = this.checkMissingBuildings(type, coords, transforn);
            if (!missing.length) return false;
            this.createConstructionSites(type, missing, transforn);
            return true;
        }

        const layout = structureLayout[rcl].buildings;
        for (const type of constructOrder) {
            if (type == STRUCTURE_ROAD && rcl >= ROAD_CONSTRUCT_RCL) {
                const data = RoomPlanner.getRoomData(this.roomName);
                if (!data) {
                    log.error(`RoomData of ${printRoomName(this.roomName)} does not exists! replaning...`);
                    RoomPlanner.planRoom(this.roomName, undefined, true);
                    return;
                }
                const paths = [...data.sourcesPath, data.controllerPath!, data.mineralPath!];
                for (const path of paths) {
                    const missing = checkAndConstructMissing(path.path, STRUCTURE_ROAD, false);
                    if (missing) return;
                }
            }

            if (type == STRUCTURE_EXTENSION) {
                const missing = checkAndConstructMissing(
                    this.filteredExtConstructingOrder.slice(0, CONTROLLER_STRUCTURES.extension[rcl]),
                    STRUCTURE_EXTENSION, false);
                if (missing) return;
                continue;
            }

            const missing = checkAndConstructMissing(layout[type], type, true);
            if (missing) return;
        }

        // TODO: outpost building
    }

    private checkMissingBuildings(type: StructureConstant, coords: Coord[], transform: boolean) {
        const room = Game.rooms[this.roomName];
        return coords.filter(coord => {
            const x = coord.x + (transform ? this.base.x : 0);
            const y = coord.y + (transform ? this.base.y : 0);
            const structure = room.lookForAt(LOOK_STRUCTURES as any, x, y)
                .filter(structure => structure.structureType == type)[0];
            return !!(!structure || (structure.owner && structure.owner.username != USER_NAME));
        })
    }

    private createConstructionSites(type: StructureConstant, coords: Coord[], transform: boolean) {
        for (const coord of coords) {
            const room = Game.rooms[this.roomName];

            const x = coord.x + (transform ? this.base.x : 0);
            const y = coord.y + (transform ? this.base.y : 0);
            const code = room.createConstructionSite(x, y, type as any);
            if (code === OK) continue;
            if (code === ERR_INVALID_TARGET) {
                const structure = room.lookForAt(LOOK_STRUCTURES as any, x, y)
                    .filter(structure => structure.structureType == type)[0];
                if (structure && structure.destroy) structure.destroy();
            }
            if (code === ERR_RCL_NOT_ENOUGH) {
                room.find(FIND_STRUCTURES).filter(structure =>
                    structure.structureType == type
                    && (structure as any).owner
                    && (structure as any).owner.username == USER_NAME).forEach(structure => structure.destroy());
            }
            return false;
        }
        return true;
    }

    private finishedBuildingsAtRcl(rcl: number): boolean {
        const room = Game.rooms[this.roomName];

        const layout = structureLayout[rcl].buildings;
        for (const type in layout) {
            if (type == STRUCTURE_EXTENSION) continue;
            const coords = layout[type];
            for (const coord of coords) {
                const structure = room.lookForAt(LOOK_STRUCTURES as any, this.base.x + coord.x, this.base.y + coord.y)
                    .filter(structure => structure.structureType == type)[0];
                if (!structure || !structure.owner || structure.owner.username == USER_NAME) return false;
            }
        }

        const count = Math.min(CONTROLLER_STRUCTURES.extension[rcl], this.filteredExtConstructingOrder.length);
        for (let i = 0; i < count; i++) {
            const structure = this.filteredExtConstructingOrder[i].lookForStructure(STRUCTURE_EXTENSION);
            if (!structure || structure.owner.username != USER_NAME) return false;
        }

        return true;
    }

    private finishedBuildingOutposts(): boolean {
        // TODO
        return false;
    }

    public clearRoom(clean: boolean = false) {
        const room = Game.rooms[this.roomName];
        if (!room) return;

        if (clean)
            room.structures.forEach(structure => !isOwner(structure) && structure.destroy());
        else {
            room.structures.forEach(structure => {
                if (isOwner(structure)) return;
                if (structure.structureType != STRUCTURE_STORAGE && structure.structureType != STRUCTURE_TERMINAL) {
                    structure.destroy();
                    return;
                }
                if (isStoreStructure(structure) && !structure.store.energy) structure.destroy();
            });
        }
    }
}