import { BaseConstructor } from 'basePlanner/BaseConstructor';
import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { log } from 'console/log';
import { profile } from 'profiler/decorator';
import { coordToRoomPosition } from 'utilities/helpers';

export const MAP_NONE = 0;
export const MAP_OUTSIDE = 200;
export const MAP_INSIDE = 2;
export const MAP_WALL = 255;
export const MAP_ON = 1;

const NUKE_BARRIER_CACHE_EXPIRATION = 50;
const NUKE_EXT_RESERVE_COUNT = 48;
const CONTROLLER_BARRIER_MULTIPLY = 10;

const BARRIER_HITS_TARGET = {
    1: 1e3,
    2: 1e3,
    3: 1e4,
    4: 5e4,
    6: 1e5,
    7: 1e6,
    8: 6e6,
};

@profile
export class BarrierPlanner {
    private static barrierPlanners: { [roomName: string]: BarrierPlanner } = {};

    private roomName: string;
    private base: RoomPosition;
    private center: RoomPosition;
    private barrier: RoomPosition[];
    private nukeBarrier: RoomPosition[];
    private nukeBarrierCacheTime: number;
    private barrierMap: CostMatrix;

    constructor(roomName: string) {
        const data = RoomPlanner.getRoomData(roomName);
        if (!data || !data.ownedRoom) {
            log.error('Should not new BaseConstructor for a non-base room!');
            return;
        }

        this.roomName = roomName;
        this.base = coordToRoomPosition(data.basePos!, roomName);
        this.center = new RoomPosition(this.base.x + 5, this.base.y + 5, roomName);
        this.barrier = [];
        this.barrierMap = new PathFinder.CostMatrix();

        BarrierPlanner.barrierPlanners[roomName] = this;
    }

    public static get(roomName: string) {
        if (!this.barrierPlanners[roomName]) return this.barrierPlanners[roomName] = new BarrierPlanner(roomName);
        return this.barrierPlanners[roomName];
    }

    public planBarriers() {
        const room = Game.rooms[this.roomName];
        if (!room) return [];
        this.copyWallsToMap(this.barrierMap);
        this.addOriginalRampart(this.barrierMap);
        this.BFS(this.barrierMap, this.base.x, this.base.y, MAP_INSIDE);
        room.find(FIND_EXIT).forEach(pos => this.BFS(this.barrierMap, pos.x, pos.y, MAP_OUTSIDE));
        this.optimizeRamparts(this.barrierMap);
        this.coverDangerousBaseBuildings(this.barrierMap);
        this.coverNukeBarriers(this.barrierMap);

        this.barrier.forEach(structure => new RoomVisual(this.roomName).structure(structure.x, structure.y, STRUCTURE_RAMPART));
        return this.barrier;
    }

    public getBarriers(): RoomPosition[] {
        if (!this.barrier.length) return this.barrier = this.planBarriers();
        return this.barrier;
    }

    public getBarrierHitsTarget(pos: RoomPosition): number {
        const room = Game.rooms[this.roomName];
        if (!room) return 0;
        let targetHits = BARRIER_HITS_TARGET[room.controller!.level];

        if (pos.isNearTo(room.controller!))
            targetHits += BARRIER_HITS_TARGET[room.controller!.level!] * (CONTROLLER_BARRIER_MULTIPLY - 1);

        const nukes = pos.findInRange(FIND_NUKES, 3);
        const centerNukes = pos.lookFor(LOOK_NUKES);
        targetHits += nukes.length * 5e6;
        targetHits += centerNukes.length * 5e6;

        return targetHits;
    }

    public getNukeBarriers(): RoomPosition[] {
        if (this.nukeBarrier && Game.time - this.nukeBarrierCacheTime < NUKE_BARRIER_CACHE_EXPIRATION)
            return this.nukeBarrier;
        const room = Game.rooms[this.roomName];
        if (!room) return [];

        this.nukeBarrierCacheTime = Game.time;
        const nukes = room.find(FIND_NUKES);
        if (nukes.length) {
            const constructor = BaseConstructor.get(this.roomName);
            const nukeBarriers: RoomPosition[] = [];
            let extensionCount = room.extensions.length;

            nukes.forEach(nuke => {
                for (let x = nuke.pos.x - 2; x <= nuke.pos.x + 2; x++) {
                    for (let y = nuke.pos.y - 2; y <= nuke.pos.y + 2; y++) {
                        const structures = constructor.getAt(x, y);
                        if (structures[STRUCTURE_SPAWN] || structures[STRUCTURE_POWER_SPAWN]
                            || structures[STRUCTURE_STORAGE] || structures[STRUCTURE_TERMINAL]
                            || structures[STRUCTURE_NUKER] || structures[STRUCTURE_FACTORY]
                            || structures[STRUCTURE_OBSERVER] || structures[STRUCTURE_TOWER]
                            || structures[STRUCTURE_LAB]) {
                            nukeBarriers.push(new RoomPosition(x, y, this.roomName));
                            continue;
                        }

                        if (structures[STRUCTURE_EXTENSION]) {
                            if (extensionCount <= NUKE_EXT_RESERVE_COUNT) {
                                nukeBarriers.push(new RoomPosition(x, y, this.roomName));
                            } else extensionCount--;
                        }
                    }
                }
            });

            return this.nukeBarrier = nukeBarriers;
        }
        return this.nukeBarrier = [];
    }

    private copyWallsToMap(map: CostMatrix) {
        const terrain = Game.map.getRoomTerrain(this.roomName);

        for (let y = 0; y < 50; ++y) {
            for (let x = 0; x < 50; ++x) {
                if (terrain.get(x, y) == TERRAIN_MASK_WALL)
                    map.set(x, y, MAP_WALL);
            }
        }
    }

    private addOriginalRampart(map: CostMatrix) {
        const terrain = Game.map.getRoomTerrain(this.roomName);

        let top = this.center.y - 9;
        if (top < 2) top = 2;

        let bottom = this.center.y + 9;
        if (bottom > 47) bottom = 47;

        let left = this.center.x - 9;
        if (left < 2) left = 2;

        let right = this.center.x + 9;
        if (right > 47) right = 47;

        for (let y = top; y < bottom + 1; y++) {
            if (terrain.get(left, y) != TERRAIN_MASK_WALL) this.setMap(map, left, y, MAP_ON);
            if (terrain.get(right, y) != TERRAIN_MASK_WALL) this.setMap(map, right, y, MAP_ON);
        }
        for (let x = left; x < right + 1; x++) {
            if (terrain.get(x, top) != TERRAIN_MASK_WALL) this.setMap(map, x, top, MAP_ON);
            if (terrain.get(x, bottom) != TERRAIN_MASK_WALL) this.setMap(map, x, bottom, MAP_ON);
        }
    }

    private setMap(map: CostMatrix, x: number, y: number, value: number) {
        if (map.get(x, y) == MAP_WALL) return;
        if (map.get(x, y) == MAP_ON) {
            if (value == MAP_ON) return;
            _.remove(this.barrier, coord => coord.x == x && coord.y == y);
        }
        if (value == MAP_ON) this.barrier.push(new RoomPosition(x, y, this.roomName));
        map.set(x, y, value);
    }

    private BFS(map: CostMatrix, x: number, y: number, value: number) {
        this.setMap(map, x, y, value);

        const offsetX = [0, 1, 1, 1, 0, -1, -1, -1];
        const offsetY = [-1, -1, 0, 1, 1, 1, 0, -1];

        for (let u = 0; u < 8; u++) {
            if (this.isValid(map, x + offsetX[u], y + offsetY[u])) {
                this.BFS(map, x + offsetX[u], y + offsetY[u], value);
            }
        }
    }

    private isValid(map: CostMatrix, x: number, y: number): boolean {
        if (x > 49 || x < 0 || y > 49 || y < 0) return false;
        return map.get(x, y) == MAP_NONE;
    }

    private optimizeRamparts(map: CostMatrix) {
        let rampartsToRemove: Coord[] = [];

        this.barrier.forEach(coord => {
            if (BarrierPlanner.getNeighbours(coord).every(coord => map.get(coord.x, coord.y) != MAP_OUTSIDE))
                rampartsToRemove.push(coord);
        });
        rampartsToRemove.forEach(coord => this.BFS(map, coord.x, coord.y, MAP_INSIDE));
        rampartsToRemove = [];

        this.barrier.forEach(coord => {
            if (BarrierPlanner.getNeighbours(coord).every(coord => map.get(coord.x, coord.y) != MAP_INSIDE))
                rampartsToRemove.push(coord);
        });
        rampartsToRemove.forEach(coord => this.BFS(map, coord.x, coord.y, MAP_OUTSIDE));
    }

    private static getNeighbours(coord: Coord): Coord[] {
        const neighbours: Coord[] = [];

        const offsetX = [0, 1, 1, 1, 0, -1, -1, -1];
        const offsetY = [-1, -1, 0, 1, 1, 1, 0, -1];

        for (let u = 0; u < 8; u++) {
            neighbours.push({ x: coord.x + offsetX[u], y: coord.y + offsetY[u] });
        }

        return neighbours;
    }

    private coverDangerousBaseBuildings(map: CostMatrix) {
        for (let y = this.base.y; y < this.base.y + 11; y++) {
            if (BarrierPlanner.isDangerous(map, this.base.x - 1, y)) this.setMap(map, this.base.x - 1, y, MAP_ON);
            if (BarrierPlanner.isDangerous(map, this.base.x, y)) this.setMap(map, this.base.x, y, MAP_ON);
            if (BarrierPlanner.isDangerous(map, this.base.x + 1, y)) this.setMap(map, this.base.x + 1, y, MAP_ON);
            if (BarrierPlanner.isDangerous(map, this.base.x + 9, y)) this.setMap(map, this.base.x + 9, y, MAP_ON);
            if (BarrierPlanner.isDangerous(map, this.base.x + 10, y)) this.setMap(map, this.base.x + 10, y, MAP_ON);
            if (BarrierPlanner.isDangerous(map, this.base.x + 11, y)) this.setMap(map, this.base.x + 11, y, MAP_ON);
        }
        for (let x = this.base.x; x < this.base.x + 11; x++) {
            if (BarrierPlanner.isDangerous(map, x, this.base.y - 1)) this.setMap(map, x, this.base.y - 1, MAP_ON);
            if (BarrierPlanner.isDangerous(map, x, this.base.y)) this.setMap(map, x, this.base.y, MAP_ON);
            if (BarrierPlanner.isDangerous(map, x, this.base.y + 1)) this.setMap(map, x, this.base.y + 1, MAP_ON);
            if (BarrierPlanner.isDangerous(map, x, this.base.y + 9)) this.setMap(map, x, this.base.y + 9, MAP_ON);
            if (BarrierPlanner.isDangerous(map, x, this.base.y + 10)) this.setMap(map, x, this.base.y + 10, MAP_ON);
            if (BarrierPlanner.isDangerous(map, x, this.base.y + 11)) this.setMap(map, x, this.base.y + 11, MAP_ON);
        }

        const controller = Game.rooms[this.roomName]?.controller;
        if (!controller) return;
        controller.pos.availableNeighbors(true, true)
            .filter(pos => this.barrierMap.get(pos.x, pos.y) == MAP_OUTSIDE)
            .forEach(pos => this.setMap(map, pos.x, pos.y, MAP_ON));
    }

    private static isDangerous(map: CostMatrix, x: number, y: number): boolean {
        for (let oy = -3; oy < 4; oy++) {
            if (map.get(x - 3, y + oy) == MAP_OUTSIDE) return true;
            if (map.get(x + 3, y + oy) == MAP_OUTSIDE) return true;
            if (map.get(x - 2, y + oy) == MAP_OUTSIDE) return true;
            if (map.get(x + 2, y + oy) == MAP_OUTSIDE) return true;
        }
        for (let ox = -1; ox < 2; ox++) {
            if (map.get(x + ox, y - 3) == MAP_OUTSIDE) return true;
            if (map.get(x + ox, y + 3) == MAP_OUTSIDE) return true;
            if (map.get(x + ox, y - 2) == MAP_OUTSIDE) return true;
            if (map.get(x + ox, y + 2) == MAP_OUTSIDE) return true;
        }
        return false;
    }

    private coverNukeBarriers(map: CostMatrix) {

    }
}