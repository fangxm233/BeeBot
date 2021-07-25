import { Bee, bees } from 'Bee/Bee';
import { PowerBee } from 'powerBee/powerBee';
import { profile } from '../profiler/decorator';

@profile
export class Traveler {

    private static structureMatrixCache: { [roomName: string]: CostMatrix } = {};
    private static creepMatrixCache: { [roomName: string]: CostMatrix } = {};
    private static creepMatrixTick: number;
    private static structureMatrixTick: number;

    private static moveRecord: { [name: string]: number } = {};
    private static distanceRecord: { [pos1: string]: { [pos2: string]: number } } = {};

    /**
     * move creep to destination
     * @param bee
     * @param destination
     * @param options
     * @returns {number}
     */

    public static travelTo(bee: Bee | PowerBee, destination: HasPos | RoomPosition, options: TravelToOptions = {}): number {

        // uncomment if you would like to register hostile rooms entered
        // this.updateRoomStatus(creep.room);

        if (!destination) {
            return ERR_INVALID_ARGS;
        }

        if (bee instanceof Bee && bee.fatigue > 0) {
            Traveler.circle(bee.pos, 'aqua', .3);
            return ERR_TIRED;
        }

        destination = this.normalizePos(destination);
        options = _.clone(options);

        // Fixes bug that causes creeps to idle on the other side of a room
        const distanceToEdge = destination.rangeToEdge;
        if (distanceToEdge <= (options.range || 1)) {
            options.range = Math.max(Math.abs(distanceToEdge - 1), 0);
        }

        let shouldCache = !Object.keys(options).length;

        if (options.pushCreep === undefined) options.pushCreep = true;

        // manage case where creep is nearby destination
        const rangeToDestination = bee.pos.getRangeTo(destination);
        if (options.range && rangeToDestination <= options.range) {
            return OK;
        } else if (rangeToDestination <= 1) {
            if (rangeToDestination === 1 && !options.range) {
                const direction = bee.pos.getDirectionTo(destination);
                // if (options.returnData) {
                //     options.returnData.nextPos = destination;
                //     options.returnData.path = direction.toString();
                // }
                if (options.pushCreep) this.pushCreeps(bee, direction);
                return this.move(bee, direction);
            }
            return OK;
        }

        const memory = bee.memory;

        const state = bee.travelState || { cpu: 0, destination } as TravelState;

        // uncomment to visualize destination
        // this.circle(destination.pos, "orange");

        // check if creep is stuck
        if (this.isStuck(bee, state)) {
            state.stuckCount++;
            Traveler.circle(bee.pos, 'magenta', state.stuckCount * .2);
        } else {
            state.stuckCount = 0;
        }

        // handle case where creep is stuck
        if (!options.stuckValue) {
            options.stuckValue = DEFAULT_STUCK_VALUE;
        }
        if (state.stuckCount >= options.stuckValue + Math.round(Math.random())) {
            options.ignoreCreeps = false;
            options.freshMatrix = true;
            memory._path = undefined as any;
            shouldCache = false;
        }

        // TODO:handle case where creep moved by some other function, but destination is still the same

        // delete path cache if destination is different
        if (!this.samePos(state.destination, destination)) {
            if (options.movingTarget && state.destination.isNearTo(destination)) {
                memory._path += state.destination.getDirectionTo(destination);
                state.destination = destination;
            } else {
                memory._path = undefined as any;
            }
        }

        if (options.repath && Math.random() < options.repath) {
            // add some chance that you will find a new path randomly
            memory._path = undefined as any;
        }

        // pathfinding
        let newPath = false;
        if (!memory._path) {
            newPath = true;
            if (bee instanceof Bee && bee.spawning) {
                return ERR_BUSY;
            }

            state.destination = destination;

            const cpu = Game.cpu.getUsed();
            const ret = this.findTravelPath(bee.pos, destination, options);

            const cpuUsed = Game.cpu.getUsed() - cpu;
            state.cpu = _.round(cpuUsed + state.cpu);
            if (state.cpu > REPORT_CPU_THRESHOLD) {
                // see note at end of file for more info on this
                console.log(`TRAVELER: heavy cpu use: ${bee.name}, cpu: ${state.cpu} origin: ${bee.pos}, dest: ${destination}`);
            }

            let color = 'orange';
            if (ret.incomplete) {
                // uncommenting this is a great way to diagnose creep behavior issues
                // console.log(`TRAVELER: incomplete path for ${creep.name}`);
                color = 'red';
            }

            if(!ret.incomplete && shouldCache) {
                if(!this.distanceRecord[bee.pos.name]) this.distanceRecord[bee.pos.name] = {};
                if(!this.distanceRecord[destination.name]) this.distanceRecord[destination.name] = {};
                this.distanceRecord[bee.pos.name][destination.name] = ret.path.length;
                this.distanceRecord[destination.name][bee.pos.name] = ret.path.length;
            }

            // if (options.returnData) {
            //     options.returnData.pathfinderReturn = ret;
            // }

            memory._path = Traveler.serializePath(bee.pos, ret.path, color);
            state.stuckCount = 0;
        }

        state.lastCoord = { x: bee.pos.x, y: bee.pos.y };
        bee.travelState = state;

        if (!memory._path || memory._path.length === 0) {
            return ERR_NO_PATH;
        }

        // consume path
        if (state.stuckCount === 0 && !newPath) {
            memory._path = memory._path.substr(1);
        }

        // push creeps
        if (memory._path[0] !== undefined && options.pushCreep)
            this.pushCreeps(bee, Number.parseInt(memory._path[0], 10));

        const nextDirection = parseInt(memory._path[0], 10);
        // if (options.returnData) {
        //     if (nextDirection) {
        //         let nextPos = Traveler.positionAtDirection(creep.pos, nextDirection);
        //         if (nextPos) { options.returnData.nextPos = nextPos; }
        //     }
        //     options.returnData.state = state;
        //     options.returnData.path = travelData.path;
        // }
        return this.move(bee, nextDirection as DirectionConstant);
    }

    public static travelToRoom(bee: Bee | PowerBee, roomName: string, options: TravelToOptions = {}): number {
        options = _.clone(options);
        options.range = 23;
        return this.travelTo(bee, new RoomPosition(25, 25, roomName), options);
    }

    public static moveOffExit(bee: Bee | PowerBee): ScreepsReturnCode {
        if (bee.pos.isEdge) {
            return Traveler.move(bee, bee.pos.getDirectionTo(bee.pos.availableNeighbors().filter(pos => !pos.isEdge)[0]));
        }
        return OK;
    }

    private static pushCreeps(bee: Bee | PowerBee, nextDir: number) {
        // if(creep.memory.role == 'manager') console.log('pushing')
        const obstructingCreep = this.findBlockingCreep(bee, nextDir);
        if (obstructingCreep) {
            const dir = this.getPushDirection(bee, obstructingCreep);
            if (dir !== undefined) {
                const dirtoarrow = {
                    1: '↑',
                    2: '↗',
                    3: '→',
                    4: '↘',
                    5: '↓',
                    6: '↙',
                    7: '←',
                    8: '↖',
                };
                bee.say('goto ' + dirtoarrow[dir]);
                const outcome = obstructingCreep.move(dir);
                if (outcome == OK) {
                    const state = bees[obstructingCreep.name]?.travelState;
                    if (state) state.stuckCount = 0;
                }
            } else bee.say('no way');
        }
    }

    private static findBlockingCreep(bee: Bee | PowerBee, nextDir: number): Creep | PowerCreep | undefined {
        if (nextDir == undefined) return;

        const nextPos = Traveler.positionAtDirection(bee.pos, nextDir);
        if (!nextPos) return;

        let blockCreep: Creep | PowerCreep = nextPos.lookFor(LOOK_CREEPS)[0];
        if (!blockCreep) blockCreep = nextPos.lookFor(LOOK_POWER_CREEPS)[0];

        if (blockCreep && blockCreep.my && Game.time - (this.moveRecord[blockCreep.name] || 0) > 1) {
            return blockCreep;
        }

        return;
    }

    private static getPushDirection(bee: Bee | PowerBee, pushee: Creep | PowerCreep) {
        const possiblePositions = pushee.pos.availableNeighbors();
        const dir = bee.pos.getDirectionTo(pushee.pos);

        if (bee.memory._path != undefined && bee.memory._path[1] !== undefined) {
            const nextDir = parseInt(bee.memory._path[1], 10);
            if (nextDir != undefined) {
                const nextPos = Traveler.positionAtDirection(pushee.pos, nextDir);
                if (nextPos) {
                    _.remove(possiblePositions, pos => pos.x == nextPos.x && pos.y == nextPos.y && pos.roomName == pos.roomName);
                }
            }
        }
        const swamps = _.remove(possiblePositions, pos => pos.lookFor(LOOK_TERRAIN)[0] == 'swamp');

        if (possiblePositions.length) return pushee.pos.getDirectionTo(_.min(possiblePositions, pos => {
            const dir2 = pushee.pos.getDirectionTo(pos);
            return this.comDirs(dir, dir2);
        }));
        else if (swamps.length) return pushee.pos.getDirectionTo(swamps[0]);
        else return pushee.pos.getDirectionTo(bee.pos);
    }

    public static getNowDir(creep: Creep): -1 | DirectionConstant {
        return _.get(creep, ['memory', '_trav', 'path', '0'], -1);
    }

    public static getNextDir(creep: Creep): -1 | DirectionConstant {
        return _.get(creep, ['memory', '_trav', 'path', '1'], -1);
    }

    public static comDirs(dir1: DirectionConstant, dir2: DirectionConstant): number {
        const d = Math.abs(dir2 - dir1);
        return d > 4 ? 8 - d : d;
    }

    /**
     * make position objects consistent so that either can be used as an argument
     * @param destination
     * @returns {any}
     */

    public static normalizePos(destination: HasPos | RoomPosition): RoomPosition {
        if (!(destination instanceof RoomPosition)) {
            return destination.pos;
        }
        return destination;
    }

    /**
     * check if room should be avoided by findRoute algorithm
     * @param roomName
     * @returns {RoomMemory|number}
     */

    public static checkAvoid(roomName: string) {
        return Memory.rooms && Memory.rooms[roomName] && Memory.rooms[roomName].avoid;
    }

    /**
     * check if a position is an exit
     * @param pos
     * @returns {boolean}
     */

    public static isExit(pos: Coord): boolean {
        return pos.x === 0 || pos.y === 0 || pos.x === 49 || pos.y === 49;
    }

    /**
     * check two coordinates match
     * @param pos1
     * @param pos2
     * @returns {boolean}
     */

    public static sameCoord(pos1: Coord, pos2: Coord): boolean {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }

    /**
     * check if two positions match
     * @param pos1
     * @param pos2
     * @returns {boolean}
     */

    public static samePos(pos1: RoomPosition, pos2: RoomPosition) {
        return this.sameCoord(pos1, pos2) && pos1.roomName === pos2.roomName;
    }

    /**
     * draw a circle at position
     * @param pos
     * @param color
     * @param opacity
     */

    public static circle(pos: RoomPosition, color: string, opacity?: number) {
        new RoomVisual(pos.roomName).circle(pos, {
            radius: .45, fill: 'transparent', stroke: color, strokeWidth: .15, opacity,
        });
    }

    /**
     * update memory on whether a room should be avoided based on controller owner
     * @param room
     */

    public static updateRoomStatus(room: Room) {
        if (!room) {
            return;
        }
        if (room.controller) {
            if (room.controller.owner && !room.controller.my) {
                room.memory.avoid = 1;
            } else {
                room.memory.avoid = undefined as any;
            }
        }
    }

    /**
     * find a path from origin to destination
     * @param origin
     * @param destination
     * @param options
     * @returns {PathfinderReturn}
     */

    public static findTravelPath(origin: RoomPosition | HasPos, destination: RoomPosition | HasPos,
                                 options: TravelToOptions = {}): PathfinderReturn {

        _.defaults(options, {
            ignoreCreeps: true,
            maxOps: DEFAULT_MAXOPS,
            range: 1,
        });

        if (options.movingTarget) {
            options.range = 0;
        }

        origin = this.normalizePos(origin);
        destination = this.normalizePos(destination);
        const originRoomName = origin.roomName;
        const destRoomName = destination.roomName;

        // check to see whether findRoute should be used
        const roomDistance = Game.map.getRoomLinearDistance(origin.roomName, destination.roomName);
        let allowedRooms = options.route;
        if (!allowedRooms && (options.useFindRoute || (options.useFindRoute === undefined && roomDistance > 2))) {
            const route = this.findRoute(origin.roomName, destination.roomName, options);
            if (route) {
                allowedRooms = route;
            }
        }

        let roomsSearched = 0;

        const callback = (roomName: string): CostMatrix | boolean => {

            if (allowedRooms) {
                if (!allowedRooms[roomName]) {
                    return false;
                }
            } else if (!options.allowHostile && Traveler.checkAvoid(roomName)
                && roomName !== destRoomName && roomName !== originRoomName) {
                return false;
            }

            roomsSearched++;

            let matrix;
            const room = Game.rooms[roomName];
            if (room) {
                if (options.ignoreStructures) {
                    matrix = new PathFinder.CostMatrix();
                    if (!options.ignoreCreeps) {
                        Traveler.addCreepsToMatrix(room, matrix);
                    }
                } else if (options.ignoreCreeps || roomName !== originRoomName) {
                    if (options.matrix) {
                        matrix = options.matrix;
                        Traveler.addStructuresToMatrix(room, matrix, 1);
                    } else matrix = this.getStructureMatrix(room, options.freshMatrix);
                } else {
                    if (options.matrix) {
                        matrix = options.matrix.clone();
                        Traveler.addCreepsToMatrix(room, matrix);
                    } else {
                        matrix = this.getCreepMatrix(room);
                    }
                }

                if (options.obstacles) {
                    matrix = matrix.clone();
                    for (const obstacle of options.obstacles) {
                        if (obstacle.pos.roomName !== roomName) {
                            continue;
                        }
                        matrix.set(obstacle.pos.x, obstacle.pos.y, 0xff);
                    }
                }
            }

            if (options.roomCallback) {
                if (!matrix) {
                    matrix = new PathFinder.CostMatrix();
                }
                const outcome = options.roomCallback(roomName, matrix.clone());
                if (outcome !== undefined) {
                    return outcome;
                }
            }

            return matrix as CostMatrix;
        };

        let ret = PathFinder.search(origin, { pos: destination, range: options.range! }, {
            maxOps: options.maxOps,
            maxRooms: options.maxRooms,
            plainCost: options.offRoad ? 1 : options.ignoreRoads ? 1 : 2,
            swampCost: options.offRoad ? 1 : options.ignoreRoads ? 5 : 10,
            roomCallback: callback,
        });

        if (ret.incomplete && options.ensurePath) {

            if (options.useFindRoute === undefined) {

                // handle case where pathfinder failed at a short distance due to not using findRoute
                // can happen for situations where the creep would have to take an uncommonly indirect path
                // options.allowedRooms and options.routeCallback can also be used to handle this situation
                if (roomDistance <= 2) {
                    console.log(`TRAVELER: path failed without findroute, trying with options.useFindRoute = true`);
                    console.log(`from: ${origin}, destination: ${destination}`);
                    options.useFindRoute = true;
                    ret = this.findTravelPath(origin, destination, options);
                    console.log(`TRAVELER: second attempt was ${ret.incomplete ? 'not ' : ''}successful`);
                    return ret;
                }

                // TODO: handle case where a wall or some other obstacle is blocking the exit assumed by findRoute
            }
        }

        return ret;
    }

    /**
     * find a viable sequence of rooms that can be used to narrow down pathfinder's search algorithm
     * @param origin
     * @param destination
     * @param options
     * @returns {{}}
     */

    public static findRoute(origin: string, destination: string,
                            options: TravelToOptions = {}): { [roomName: string]: boolean } | void {

        const restrictDistance = options.restrictDistance || Game.map.getRoomLinearDistance(origin, destination) + 10;
        const allowedRooms = { [origin]: true, [destination]: true };

        let highwayBias = 1;
        if (options.preferHighway) {
            highwayBias = 2.5;
            if (options.highwayBias) {
                highwayBias = options.highwayBias;
            }
        }

        const ret = Game.map.findRoute(origin, destination, {
            routeCallback: (roomName: string) => {

                if (options.routeCallback) {
                    const outcome = options.routeCallback(roomName);
                    if (outcome !== undefined) {
                        return outcome;
                    }
                }

                const rangeToRoom = Game.map.getRoomLinearDistance(origin, roomName);
                if (rangeToRoom > restrictDistance) {
                    // room is too far out of the way
                    return Number.POSITIVE_INFINITY;
                }

                if (!options.allowHostile && Traveler.checkAvoid(roomName) &&
                    roomName !== destination && roomName !== origin) {
                    // room is marked as "avoid" in room memory
                    return Number.POSITIVE_INFINITY;
                }

                let parsed;
                if (options.preferHighway) {
                    parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName) as any;
                    const isHighway = (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
                    if (isHighway) {
                        return 1;
                    }
                }
                // SK rooms are avoided, harvested-from SK rooms are allowed
                if (!options.allowSK) {
                    if (!parsed) {
                        parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName) as any;
                    }
                    const fMod = parsed[1] % 10;
                    const sMod = parsed[2] % 10;
                    const isSK = !(fMod === 5 && sMod === 5) &&
                        ((fMod >= 4) && (fMod <= 6)) &&
                        ((sMod >= 4) && (sMod <= 6));
                    if (isSK) {
                        return 10 * highwayBias;
                    }
                }

                return highwayBias;
            },
        });

        if (!_.isArray(ret)) {
            console.log(`couldn't findRoute to ${destination}`);
            return;
        }
        for (const value of ret) {
            allowedRooms[value.room] = true;
        }

        return allowedRooms;
    }

    /**
     * check how many rooms were included in a route returned by findRoute
     * @param origin
     * @param destination
     * @returns {number}
     */

    public static routeDistance(origin: string, destination: string): number | void {
        const linearDistance = Game.map.getRoomLinearDistance(origin, destination);
        if (linearDistance >= 32) {
            return linearDistance;
        }

        const allowedRooms = this.findRoute(origin, destination);
        if (allowedRooms) {
            return Object.keys(allowedRooms).length;
        }
    }

    /**
     * build a cost matrix based on structures in the room. Will be cached for more than one tick. Requires vision.
     * @param room
     * @param freshMatrix
     * @returns {any}
     */

    public static getStructureMatrix(room: Room, freshMatrix?: boolean, structureCost?: number): CostMatrix {
        if (!this.structureMatrixCache[room.name] || (freshMatrix && Game.time !== this.structureMatrixTick)) {
            this.structureMatrixTick = Game.time;
            const matrix = new PathFinder.CostMatrix();
            this.structureMatrixCache[room.name] = Traveler.addStructuresToMatrix(room, matrix, 1, structureCost);
        }
        return this.structureMatrixCache[room.name];
    }

    /**
     * build a cost matrix based on creeps and structures in the room. Will be cached for one tick. Requires vision.
     * @param room
     * @returns {any}
     */

    public static getCreepMatrix(room: Room) {
        if (!this.creepMatrixCache[room.name] || Game.time !== this.creepMatrixTick) {
            this.creepMatrixTick = Game.time;
            this.creepMatrixCache[room.name] = Traveler.addCreepsToMatrix(room,
                this.getStructureMatrix(room, true).clone());
        }
        return this.creepMatrixCache[room.name];
    }

    /**
     * add structures to matrix so that impassible structures can be avoided and roads given a lower cost
     * @param room
     * @param matrix
     * @param roadCost
     * @returns {CostMatrix}
     */

    public static addStructuresToMatrix(room: Room, matrix: CostMatrix, roadCost: number, structureCost?: number): CostMatrix {

        const impassibleStructures: Structure[] = [];
        for (const structure of room.structures) {
            if (structure instanceof StructureRampart) {
                if (!structure.my && !structure.isPublic) {
                    impassibleStructures.push(structure);
                }
            } else if (structure instanceof StructureRoad) {
                matrix.set(structure.pos.x, structure.pos.y, roadCost);
            } else if (structure instanceof StructureContainer) {
                matrix.set(structure.pos.x, structure.pos.y, 5);
            } else {
                impassibleStructures.push(structure);
            }
        }

        for (const site of room.find(FIND_CONSTRUCTION_SITES)) {
            if (site.structureType === STRUCTURE_CONTAINER || site.structureType === STRUCTURE_ROAD
                || site.structureType === STRUCTURE_RAMPART) {
                continue;
            }
            matrix.set(site.pos.x, site.pos.y, structureCost || 0xff);
        }

        for (const structure of impassibleStructures) {
            matrix.set(structure.pos.x, structure.pos.y, structureCost || 0xff);
        }

        return matrix;
    }

    /**
     * add creeps to matrix so that they will be avoided by other creeps
     * @param room
     * @param matrix
     * @returns {CostMatrix}
     */

    public static addCreepsToMatrix(room: Room, matrix: CostMatrix): CostMatrix {
        room.find(FIND_CREEPS).forEach((creep: Creep) => matrix.set(creep.pos.x, creep.pos.y, 0xff));
        room.find(FIND_POWER_CREEPS).forEach(creep => matrix.set(creep.pos.x, creep.pos.y, 0xff));
        return matrix;
    }

    /**
     * serialize a path, traveler style. Returns a string of directions.
     * @param startPos
     * @param path
     * @param color
     * @returns {string}
     */

    public static serializePath(startPos: RoomPosition, path: RoomPosition[], color = 'orange', notVisual?: boolean): string {
        let serializedPath = '';
        let lastPosition = startPos;
        if (!notVisual) this.circle(startPos, color);
        for (const position of path) {
            if (position.roomName === lastPosition.roomName) {
                if (!notVisual) new RoomVisual(position.roomName)
                    .line(position, lastPosition, { color, lineStyle: 'dashed' });
                serializedPath += lastPosition.getDirectionTo(position);
            }
            lastPosition = position;
        }
        return serializedPath;
    }

    /**
     * returns a position at a direction relative to origin
     * @param origin
     * @param direction
     * @returns {RoomPosition}
     */

    public static positionAtDirection(origin: RoomPosition, direction: number): RoomPosition | void {
        if (!direction) return;
        const offsetX = [0, 0, 1, 1, 1, 0, -1, -1, -1];
        const offsetY = [0, -1, -1, 0, 1, 1, 1, 0, -1];
        const x = origin.x + offsetX[direction];
        const y = origin.y + offsetY[direction];
        if (x > 49 || x < 0 || y > 49 || y < 0) {
            return;
        }
        return new RoomPosition(x, y, origin.roomName);
    }

    public static oppositeDirection(direction: DirectionConstant): DirectionConstant {
        switch (direction) {
            case TOP:
                return BOTTOM;
            case TOP_LEFT:
                return BOTTOM_RIGHT;
            case LEFT:
                return RIGHT;
            case BOTTOM_LEFT:
                return TOP_RIGHT;
            case BOTTOM:
                return TOP;
            case BOTTOM_RIGHT:
                return TOP_LEFT;
            case RIGHT:
                return LEFT;
            case TOP_RIGHT:
                return BOTTOM_LEFT;
        }
    }

    public static getDistance(pos1: RoomPosition, pos2: RoomPosition): number {
        if(pos1.isNearTo(pos2)) return 1;
        const pos1Name = pos1.name;
        const pos2Name = pos2.name;
        if(this.distanceRecord[pos1Name][pos2Name]) return this.distanceRecord[pos1Name][pos2Name];
        return pos1.getMultiRoomRangeTo(pos2);
    }

    private static isStuck(bee: Bee | PowerBee, state: TravelState): boolean {
        let stuck = false;
        if (state.lastCoord !== undefined) {
            if (this.sameCoord(bee.pos, state.lastCoord)) {
                // didn't move
                stuck = true;
            } else if (this.isExit(bee.pos) && this.isExit(state.lastCoord)) {
                // moved against exit
                stuck = true;
            }
        }

        return stuck;
    }

    private static move(bee: Bee | PowerBee, dir: DirectionConstant): ScreepsReturnCode {
        const code = bee.move(dir);
        if (code == OK) this.moveRecord[bee.name] = Game.time;
        return code;
    }
}

// this might be higher than you wish, setting it lower is a great way to diagnose creep behavior issues. When creeps
// need to repath to often or they aren't finding valid paths, it can sometimes point to problems elsewhere in your code
const REPORT_CPU_THRESHOLD = 1000;

const DEFAULT_MAXOPS = 20000;
const DEFAULT_STUCK_VALUE = 2;
const STATE_PREV_X = 0;
const STATE_PREV_Y = 1;
const STATE_STUCK = 2;
const STATE_CPU = 3;
const STATE_DEST_X = 4;
const STATE_DEST_Y = 5;
const STATE_DEST_ROOMNAME = 6;

// assigns a function to Creep.prototype: creep.travelTo(destination)
// PowerCreep.prototype.travelTo = function (destination: RoomPosition | { pos: RoomPosition }, options?: TravelToOptions) {
//     return Traveler.travelTo(this, destination, options);
// };
// PowerCreep.prototype.moveOffExit = function () {
//     Traveler.moveOffExit(this);
// }