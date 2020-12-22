import { Intel } from "dataManagement/Intel";
import { Traveler } from "movement/Traveler";
import { profile } from "profiler/decorator";
import { packNumber, packPos, unpackNumber, unpackPos } from "utilities/packrat";
import { RoomPlanner } from "./RoomPlanner";
import { Cartographer, ROOMTYPE_CORE, ROOMTYPE_SOURCEKEEPER } from 'utilities/Cartographer';

export const PLAIN_COST = 3;
export const SWAMP_COST = 4;
export const WALL_COST = 15 * PLAIN_COST;
export const EXISTING_PATH_COST = PLAIN_COST - 1;

@profile
export class RoadPlanner {
    public roomName: string;
    private base: Coord;
    private isColony: boolean;

    constructor(roomName: string, base: Coord, isColony: boolean) {
        this.roomName = roomName;
        this.base = base;
        this.isColony = isColony;
    }

    public generatePathTo(pos: RoomPosition, avoidCenter?: boolean): GeneratePathResult {
        const center = new RoomPosition(this.base.x + 5, this.base.y + 5, this.roomName);

        let missing = false;
        const result = PathFinder.search(center, { pos, range: 0 }, {
            maxOps: 1e4, heuristicWeight: 1, plainCost: PLAIN_COST, swampCost: SWAMP_COST,
            roomCallback: roomName => {
                if (roomName == this.roomName) return RoomPlanner.getBaseCostMatrix(roomName, this.base, 8);
                if (this.isColony) return false;
                const type = Cartographer.roomType(roomName);
                if(avoidCenter && (type == ROOMTYPE_CORE || type == ROOMTYPE_SOURCEKEEPER)) return false;

                const matrix = Intel.getRoomCostMatrix(roomName);
                if (matrix) return matrix;
                missing = true;
                return false;
            }
        });

        if (missing) return { matrixMissing: true };
        if (result.incomplete) return { incomplete: true };

        _.remove(result.path, pos => pos.isEdge);
        return { path: result.path };
    }

    public cutPath(path: RoomPosition[], cutting: number = 0) {
        path.splice(path.length - cutting, cutting);
        return path;
    }

    public updateMatrix(road: RoomPosition[]) {
        road.forEach(pos => {
            const matrix = Intel.getRoomCostMatrix(pos.roomName);
            if (matrix) matrix.set(pos.x, pos.y, EXISTING_PATH_COST);
        })
    }

    public static serializePath(rawPath: Path): string[] {
        const result: string[] = [];
        const positions = rawPath.path;
        let start = packPos(positions[0]);
        let path = '';
        let lastRoom = positions[0].roomName;

        for (let i = 0; i < positions.length; i++) {
            if (i == positions.length - 1) {
                result.push(start + packNumber(path));
                break;
            }
            const pos = positions[i];
            const posNext = positions[i + 1];
            if (posNext.isEdge) continue;
            if (pos.roomName != lastRoom) {
                lastRoom = pos.roomName;
                result.push(start + packNumber(path));
                start = packPos(pos);
                path = '';
            }
            if (pos.isEdge) continue;
            if (pos.roomName != posNext.roomName) continue;
            path += pos.getDirectionTo(posNext);
        }

        return result;
    }

    public static deserializePath(serialized: string[]): Path {
        const result: RoomPosition[] = [];
        for (let path of serialized) {
            let lastPos = unpackPos(path.substr(0, 2)); // 起始位置占两个字符
            result.push(lastPos);
            path = path.slice(2);

            for (const dir of unpackNumber(path)) {
                const pos = Traveler.positionAtDirection(lastPos, Number.parseInt(dir, 10));
                if (!pos) continue;
                result.push(pos);
                lastPos = pos;
            }
        }
        return { path: result, length: result.length };
    }
}