import { log } from "console/log";
import { Intel } from "dataManagement/Intel";
import { ROOM_DATA_SEGMENT, SegmentManager } from "dataManagement/segmentManager";
import { timer } from "event/Timer";
import { profile } from "profiler/decorator";
import { coordToRoomPosition, timeAfterTick } from "utilities/helpers";
import { packCoord, packCoordList, packRoomName, unpackCoord, unpackCoordList, unpackRoomName } from "utilities/packrat";
import { isCoordEqual, printRoomName } from "utilities/utils";
import { Visualizer } from "visuals/Visualizer";
import { BaseConstructor } from "./BaseConstructor";
import { RoadPlanner } from "./RoadPlanner";
import { exits, fillingRouteCoords, reactionLabCoords, sourceLabCoords, structureLayout } from './structurePreset';

const ROAD_COST = 1;
const CONTAINER_COST = 5;
const WALL_OCCUPIED_COUNT = 3;          // 允许基地内被墙占据的格子最大数目
const PERIPHERY_WIDTH = 3;              // 边缘宽度
const ROAD_SWAMP_SCORE = -0.6;          // 在路上的沼泽得分
const BUILDING_SWAMP_SCORE = -0.2;      // 在建筑底下的沼泽得分
const PERIPHERY_SWAMP_SCORE = -0.2;     // 边缘沼泽得分
const PERIPHERY_WALL_SCORE = -1;        // 边缘墙壁得分
const PERIPHERY_EXIT_SCORE = -1 / 4;    // 靠近边缘距离得分
const OCCUPIED_EXIT_SCORE = -1.5;       // 被堵住出口得分
const OCCUPIED_EXTENSION_SCORE = -2;    // 无效建筑得分
const SOURCE_DISTANCE_SCORE = -0.3;     // source距离得分
const MINERAL_DISTANCE_SCORE = -0.1;    // mineral距离得分
const CONTROLLER_DISTANCE_SCORE = -0.4; // controller距离得分

const finalBase = structureLayout[8].buildings;
const occupiablePos = {};
for (const pos of finalBase[STRUCTURE_EXTENSION]) {
    occupiablePos[`${pos.x}_${pos.y}`] = true;
}

const layoutStructureTypeMap: { [rcl: number]: { [coord: string]: StructureConstant } } = {};
for (const rcl in structureLayout) {
    const layout = structureLayout[rcl];
    layoutStructureTypeMap[rcl] = {};
    for (const structureType in layout.buildings) {
        const coords = layout.buildings[structureType];
        coords.forEach(coord => layoutStructureTypeMap[rcl][`${coord.x}_${coord.y}`] = structureType as StructureConstant);
    }
}

@profile
export class RoomPlanner {
    private static roomData: { [roomName: string]: RoomData } = {};

    public static planRoom(baseName: string, to?: string, loop?: boolean) {
        const result = this.planRoomCore(baseName, to);
        if ((result.intelMissing || result.matrixMissing) && loop)
            timer.callBackAtTick(timeAfterTick(1), () => this.planRoom(baseName, to, true));
        return result;
    }

    public static planRoomCore(baseName: string, to?: string): PlanRoomResult {
        const ownedRoom = !to;
        const result: RoomData = { ownedRoom } as any;

        let base: Coord | undefined;
        if (ownedRoom) {
            const room = Game.rooms[baseName];
            const spawn = room?.spawns.filter(spawn => spawn.my)[0];
            if (spawn) {
                base = { x: spawn.pos.x - 4, y: spawn.pos.y - 8 };
            }
            else base = this.findBasePos(baseName);
        }
        else base = this.getRoomData(baseName)?.basePos;
        if (!base) {
            Intel.requestRoomIntel(baseName);
            log.warning(`Failed to find basePos for ${baseName}.`);
            return { failed: true };
        }
        result.basePos = base;

        const target = ownedRoom ? baseName : to!;
        const intel = Intel.getRoomIntel(target);
        if (!intel) return { intelMissing: true };

        const center = new RoomPosition(base.x + 5, base.y + 5, baseName);
        const roadPlanner = new RoadPlanner(baseName, base, ownedRoom);

        const getReturn = (result: GeneratePathResult): PlanRoomResult => {
            if (result.incomplete) {
                log.warning('Failed to plan room: path incomplete.');
                return { failed: true };
            }
            if (result.matrixMissing) return { matrixMissing: true };
            return {};
        }

        const alreadyPlanned = (pos: Coord) => {
            if (result.harvestPos.source.find(coord => isCoordEqual(pos, coord))) return true;
            if (isCoordEqual(result.harvestPos.mineral!, pos)) return true;
            if (isCoordEqual(result.containerPos?.controller!, pos)) return true;
            if (isCoordEqual(result.linkPos?.controller!, pos)) return true;
            return false;
        }

        const isOnRoad = (pos: Coord, path: Coord[]) => {
            return !!path.find(coord => coord.x == pos.x && coord.y == pos.y);
        }

        const findBestPath = (coord: Coord): PlanRoomResult & { path?: RoomPosition[], last?: RoomPosition } => {
            const pos = coordToRoomPosition(coord, target);
            const min = _.min(_.map(pos.availableNeighbors(true, ownedRoom).filter(pos => !alreadyPlanned(pos)),
                pos => roadPlanner.generatePathTo(pos)), result => !result.path ? Infinity : result.path!.length
            );

            const path = min.path;
            if (!path) return getReturn(min);

            roadPlanner.updateMatrix(path);
            const last = _.last(min.path!);
            return { path: roadPlanner.cutPath(min.path!, 2), last };
        }

        result.harvestPos = { source: [] };
        result.sourcesPath = [];
        if (ownedRoom) result.linkPos = { source: [], controller: undefined! };
        intel.sources = _.sortBy(intel.sources!,
                coord => center.getMultiRoomRangeTo(coordToRoomPosition(coord, target)));
        for (const coord of intel.sources!) {
            const best = findBestPath(coord);
            if (!best.path) return best;

            result.harvestPos.source.push(best.last!);
            result.sourcesPath.push({ path: best.path, length: best.path.length });

            if (ownedRoom) {
                result.linkPos!.source.push(_.min(best.last!.availableNeighbors(true, true).filter(
                    pos => !alreadyPlanned(pos) && !isOnRoad(pos, best.path!)),
                    pos => pos.getRangeTo(center))
                );
            }
        }

        if (ownedRoom) {
            let best = findBestPath(intel.controller!);
            if (!best.path) return best;

            result.containerPos = { controller: best.last! };
            result.controllerPath = { path: best.path, length: best.path.length };

            result.linkPos!.controller = _.min(best.last!.availableNeighbors(true, true).filter(
                pos => !alreadyPlanned(pos) && !isOnRoad(pos, best.path!)),
                pos => pos.getRangeTo(center));


            best = findBestPath(intel.mineral!);
            if (!best.path) return best;

            result.harvestPos.mineral = best.last!;
            result.mineralPath = { path: best.path, length: best.path.length };
        }

        const visual = new RoomVisual();
        for (const structure in finalBase) {
            const coords = finalBase[structure];
            coords.forEach(coord => visual.structure(coord.x + base!.x, coord.y + base!.y, structure));
        }

        result.sourcesPath.forEach(road => Visualizer.drawRoads(road.path));
        result.harvestPos.source.forEach(coord => visual.structure(coord.x, coord.y, STRUCTURE_CONTAINER));
        if (ownedRoom) {
            visual.structure(result.containerPos!.controller.x, result.containerPos!.controller.y, STRUCTURE_CONTAINER);
            visual.structure(result.harvestPos.mineral!.x, result.harvestPos.mineral!.y, STRUCTURE_CONTAINER);
            visual.structure(result.linkPos!.controller.x, result.linkPos!.controller.y, STRUCTURE_LINK);
            result.linkPos!.source.forEach(coord => visual.structure(coord.x, coord.y, STRUCTURE_LINK));
            Visualizer.drawRoads(result.controllerPath!.path);
            Visualizer.drawRoads(result.mineralPath!.path);
        }

        if(!to) log.info(`Completed plan for ${baseName}.`);
        else log.info(`Completed plan from ${baseName} to ${to}.`);
        this.roomData[target] = result;
        this.serializeData();
        return { result };
    }

    public static findBasePos(roomName: string): Coord | undefined {
        const candidatePoses = this.findCandidates(roomName, 2, 38, 11);
        log.debug(JSON.stringify(candidatePoses.map(p => ([p,this.scoreCandidate(roomName, p)]))));

        const pos = _.max(candidatePoses, coord => this.scoreCandidate(roomName, coord));

        if(pos as any == -Infinity) return;
        return pos;
    }

    private static findCandidates(roomName: string, from: number, to: number, baseSize: number) {
        const terrain = Game.map.getRoomTerrain(roomName);

        const candidatePoses: Coord[] = [];
        for (let x = from; x < to; x++) {
            for (let y = from; y < to; y++) {
                let occupiedCount = 0;
                let pass = true;
                for (let bx = 0; bx < baseSize; bx++) {
                    for (let by = 0; by < baseSize; by++) {
                        const t = terrain.get(x + bx, y + by);
                        if (t == TERRAIN_MASK_WALL) {
                            occupiedCount++;
                            if (!occupiablePos[`${bx}_${by}`] || occupiedCount > WALL_OCCUPIED_COUNT) {
                                pass = false;
                                break;
                            }
                        }
                    }
                    if (!pass) break;
                }
                if (pass) candidatePoses.push({ x, y });
            }
        }
        return candidatePoses;
    }

    private static scoreCandidate(roomName: string, coord: Coord) {
        const terrain = Game.map.getRoomTerrain(roomName);
        const room = Game.rooms[roomName];
        const { x, y } = coord;
        const center = new RoomPosition(x + 5, y + 5, roomName);
        const swamps: Coord[] = [];
        const walls: Coord[] = [];
        const peripherySwamps: Coord[] = [];
        const peripheryWalls: Coord[] = [];
        let score = 100;

        for (let bx = -PERIPHERY_WIDTH; bx < 11 + PERIPHERY_WIDTH; bx++) {
            for (let by = -PERIPHERY_WIDTH; by < 11 + PERIPHERY_WIDTH; by++) {
                const isOutside = bx < 0 || bx > 10 || by < 0 || by > 10;
                const coord = { x: bx, y: by };
                if (x + bx < 0 || x + bx > 49 || y + by < 0 || y + by > 49) {
                    score += PERIPHERY_WALL_SCORE;
                    continue;
                }

                switch (terrain.get(x + bx, y + by)) {
                    case TERRAIN_MASK_WALL:
                        if (!isOutside) walls.push(coord);
                        else peripheryWalls.push(coord)
                        break;
                    case TERRAIN_MASK_SWAMP:
                        if (!isOutside) swamps.push(coord);
                        else peripherySwamps.push(coord);
                        break;
                }
            }
        }
        score += peripherySwamps.length * PERIPHERY_SWAMP_SCORE;
        score += peripheryWalls.length * PERIPHERY_WALL_SCORE;
        score += walls.length * OCCUPIED_EXTENSION_SCORE;
        score += peripheryWalls.filter(coord => !!exits.find(c => c.x == coord.x && c.y == coord.y)).length *
            (OCCUPIED_EXIT_SCORE - PERIPHERY_WALL_SCORE)
        finalBase[STRUCTURE_EXTENSION].forEach(coord => {
            const bx = x + coord.x;
            const by = y + coord.y;
            if (bx < 2 || bx > 47 || by < 2 || by > 47) score += OCCUPIED_EXTENSION_SCORE;
            else if (peripheryWalls.find(c => c.x == bx && c.y == by))
                score += OCCUPIED_EXTENSION_SCORE - PERIPHERY_WALL_SCORE;
        });

        const roomExits = room.find(FIND_EXIT);
        roomExits.forEach(exit => score += Math.max(11 - exit.getRangeTo(center), 0) * PERIPHERY_EXIT_SCORE);

        const swampMap = _.countBy(swamps, coord => this.getLayoutStructureType(8, coord) === STRUCTURE_ROAD);
        score += (swampMap.true || 0) * ROAD_SWAMP_SCORE;
        score += (swampMap.false || 0) * BUILDING_SWAMP_SCORE;

        const matrix = new PathFinder.CostMatrix();
        for (const structureType in finalBase) {
            const coords = finalBase[structureType];
            const cost = structureType === STRUCTURE_ROAD ? ROAD_COST : 0xff;
            coords.forEach(coord => matrix.set(x + coord.x, y + coord.y, cost));
        }

        const findPath = structure => PathFinder.search(new RoomPosition(x + 5, y + 5, roomName),
            { pos: structure.pos, range: 1 }, {
            maxOps: 1e4, heuristicWeight: 1,
            roomCallback: room => room == roomName ? matrix : false,
        });
        room.sources.forEach(source => score += findPath(source).path.length * SOURCE_DISTANCE_SCORE);
        score += findPath(room.mineral).path.length * MINERAL_DISTANCE_SCORE;
        score += findPath(room.controller!).path.length * CONTROLLER_DISTANCE_SCORE;

        return score;
    }

    public static getBaseCostMatrix(baseName: string, base: Coord, rcl: number) {
        const matrix = new PathFinder.CostMatrix();
        const layout = structureLayout[rcl].buildings;

        for (const type in layout) {
            const coords = layout[type];
            let cost = 0xff;
            if (type == STRUCTURE_ROAD) cost = ROAD_COST;
            if (type == STRUCTURE_CONTAINER) cost = CONTAINER_COST;
            coords.forEach(coord => matrix.set(base.x + coord.x, base.y + coord.y, cost));
        }

        const data = this.getRoomData(baseName);
        if (data) {
            data.sourcesPath.forEach(path => path.path.forEach(coord => matrix.set(coord.x, coord.y, ROAD_COST)));
            data.mineralPath!.path.forEach(coord => matrix.set(coord.x, coord.y, ROAD_COST));
            data.controllerPath!.path.forEach(coord => matrix.set(coord.x, coord.y, ROAD_COST));
            [data.linkPos!.controller, ...data.linkPos!.source].forEach(coord => matrix.set(coord.x, coord.y, 0xff));
            [...data.harvestPos.source, data.containerPos!.controller]
                .forEach(coord => matrix.set(coord.x, coord.y, CONTAINER_COST));
        }
        return matrix;
    }

    private static getLayoutStructureType(rcl: number, coord: Coord): StructureConstant {
        return layoutStructureTypeMap[rcl][`${coord.x}_${coord.y}`];
    }

    public static getRoomData(roomName: string): RoomData | undefined {
        return this.roomData[roomName];
    }

    public static removeRoomData(roomName: string) {
        this.roomData[roomName] = undefined!;
        this.serializeData();
    }

    public static getFillingRoute(base: Coord, roomName: string, line: number) {
        return fillingRouteCoords[line].map(
            coord => coordToRoomPosition({ x: base.x + coord.x, y: base.y + coord.y }, roomName));
    }

    public static getFillerContainer(roomName: string, id: number) {
        return BaseConstructor.get(roomName).getForAtBase(STRUCTURE_CONTAINER, finalBase[STRUCTURE_CONTAINER][id]);
    }

    public static isFillerContainer(pos: RoomPosition) {
        const center = RoomPlanner.getRoomData(pos.roomName)?.basePos;
        if(!center) return false;
        return !!finalBase[STRUCTURE_CONTAINER]
            .find(coord => pos.x - center.x == coord.x && pos.y - center.y == coord.y);
    }

    public static getManagerPos(roomName: string): RoomPosition | undefined {
        const data = this.getRoomData(roomName);
        if (!data) return;
        return new RoomPosition(data.basePos!.x + 6, data.basePos!.y + 4, roomName);
    }

    public static getLabs(roomName: string): StructureLab[] {
        const room = Game.rooms[roomName];
        if(!room) return [];
        return room.labs;
    }

    public static getSourceLabs(roomName: string): StructureLab[] {
        const data = this.getRoomData(roomName);
        if(!data) return [];
        return _.compact(sourceLabCoords.map(coord =>
            new RoomPosition(data.basePos!.x + coord.x, data.basePos!.y + coord.y, roomName)
                .lookForStructure(STRUCTURE_LAB)!));
    }

    public static getReactionLabs(roomName: string): StructureLab[] {
        const data = this.getRoomData(roomName);
        if(!data) return [];
        return _.compact(reactionLabCoords.map(coord =>
            new RoomPosition(data.basePos!.x + coord.x, data.basePos!.y + coord.y, roomName)
                .lookForStructure(STRUCTURE_LAB)!));
    }

    public static serializeData() {
        if (Object.keys(this.roomData).length == 0) return;
        const result: { [roomName: string]: any } = {};

        for (const roomName in this.roomData) {
            const data = this.roomData[roomName];
            if (!data) continue;
            const serialized: any = {};

            serialized.o = data.ownedRoom ? 1 : 0;
            serialized.s = _.map(data.sourcesPath, path => RoadPlanner.serializePath(path));
            const harvestPos: any = { s: packCoordList(data.harvestPos.source) };
            if (data.ownedRoom) {
                serialized.c = RoadPlanner.serializePath(data.controllerPath!);
                serialized.b = packCoord(data.basePos!);
                serialized.m = RoadPlanner.serializePath(data.mineralPath!);
                serialized.l = { s: packCoordList(data.linkPos!.source), c: packCoord(data.linkPos!.controller) }
                harvestPos.m = packCoord(data.harvestPos.mineral!);
                serialized.cp = { c: packCoord(data.containerPos!.controller) };
            }
            serialized.h = harvestPos;

            result[packRoomName(roomName)] = serialized;
        }

        SegmentManager.writeSegment(ROOM_DATA_SEGMENT, JSON.stringify(result));
    }

    public static deserializeData() {
        const seg = SegmentManager.getSegment(ROOM_DATA_SEGMENT);
        if (!seg) return;

        const raw = JSON.parse(seg);
        for (const roomName in raw) {
            const data = raw[roomName];
            const deserialized: RoomData = {
                ownedRoom: data.o == 1,
                sourcesPath: _.map(data.s, (path: string[]) => RoadPlanner.deserializePath(path)),
                harvestPos: { source: unpackCoordList(data.h.s) },
            } as any;

            if (deserialized.ownedRoom) {
                deserialized.basePos = unpackCoord(data.b);
                deserialized.controllerPath = RoadPlanner.deserializePath(data.c);
                deserialized.mineralPath = RoadPlanner.deserializePath(data.m);
                deserialized.linkPos = { source: unpackCoordList(data.l.s), controller: unpackCoord(data.l.c) };
                deserialized.harvestPos.mineral = unpackCoord(data.h.m);
                deserialized.containerPos = { controller: unpackCoord(data.cp.c) };
            }

            this.roomData[unpackRoomName(roomName)] = deserialized;
        }
    }
}

(global as any).RoomPlanner = RoomPlanner;