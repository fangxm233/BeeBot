import { BeeBot } from 'BeeBot/BeeBot';
import { INTEL_SEGMENT, SegmentManager } from 'dataManagement/SegmentManager';
import { PROCESS_SCOUT } from 'declarations/constantsExport';
import { Traveler } from 'movement/Traveler';
import { ProcessScout } from 'process/instances/scout';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import {
    Cartographer,
    ROOMTYPE_CONTROLLER,
    ROOMTYPE_CORE,
    ROOMTYPE_HIGHEAY,
    ROOMTYPE_SOURCEKEEPER,
} from 'utilities/Cartographer';
import {
    packCoord,
    packCoordList,
    packNumber,
    packRoomName,
    unpackCoord,
    unpackCoordList,
    unpackNumber,
    unpackRoomName,
} from 'utilities/packrat';

export interface RoomIntel {
    owner?: string;
    rcl?: number;
    sources?: Coord[];
    mineral?: Coord;
    mineralType?: MineralConstant;
    controller?: Coord;

    keepers?: Coord[];

    powerBank?: { pos: Coord, power: number }[];
    deposit?: { pos: Coord, cooldown: number, type: DepositConstant }[];

    invaderCore?: Coord;
    invaderLevel?: number;

    time: number;
}

interface SerializedRoomIntel {
    o?: string; // owner
    r?: number; // rcl
    s?: string; // sources
    m?: string; // mineral
    mt?: MineralConstant; // mineralType
    c?: string; // controller

    k?: string; // keepers

    t: string; // time
}

@profile
export class Intel {
    private static roomIntel: { [roomName: string]: RoomIntel } = {};
    private static roomCostMatrix: { [roomName: string]: CostMatrix } = {};
    private static requests: { roomName: string, requestType: 'intel' | 'costMatrix' }[] = [];
    private static observeRequests: string[] = [];
    private static sightRequests: string[] = [];
    private static dirty: boolean = false;

    public static getRoomIntel(roomName: string, requestWhenMissing: boolean = true): RoomIntel | undefined {
        const intel = this.roomIntel[roomName];
        if (!intel) {
            const room = Game.rooms[roomName];
            if (room) return this.scanRoom(room);

            if (requestWhenMissing) this.requestRoomIntel(roomName);
        }
        return intel;
    }

    public static requestRoomIntel(roomName: string) {
        if (this.requests.find(request => request.roomName == roomName)) return;
        this.requests.push({ roomName, requestType: 'intel' });
    }

    public static refreshRoomIntel(roomName: string) {
        const room = Game.rooms[roomName];
        if (room) this.scanRoom(room);
    }

    public static getRoomCostMatrix(roomName: string, requestWhenMissing: boolean = true): CostMatrix | undefined {
        const matrix = this.roomCostMatrix[roomName];
        if (!matrix) {
            const room = Game.rooms[roomName];
            if (room) return this.generateCostMatrix(room);

            if (requestWhenMissing) this.requestRoomCostMatrix(roomName);
        }
        return matrix;
    }

    public static requestRoomCostMatrix(roomName: string) {
        if (this.requests.find(request => request.roomName == roomName)) return;
        this.requests.push({ roomName, requestType: 'costMatrix' });
    }

    public static refreshRoomCostMatrix(roomName: string) {
        const room = Game.rooms[roomName];
        if (room) this.generateCostMatrix(room);
    }

    public static requestSight(roomName: string) {
        this.sightRequests.push(roomName);
    }

    public static requestObserve(roomName: string) {
        this.observeRequests.push(roomName);
    }

    public static handleRequests() {
        for (let i = 0; i < this.requests.length; i++) {
            const request = this.requests[i];
            const room = Game.rooms[request.roomName];
            if (!room) {
                this.requestSight(request.roomName);
            } else {
                this.scanRoom(room);
                if (request.requestType == 'costMatrix') this.generateCostMatrix(room);
                this.requests.splice(i--);
            }
        }

        this.handleSights();
        this.handleObserves();
    }

    private static handleSights() {
        this.sightRequests.forEach(roomName => {
            if (BeeBot.getObservers()
                .find(ob => Game.map.getRoomLinearDistance(roomName, ob.pos.roomName) <= 10)) {
                this.requestObserve(roomName);
            } else {
                const room = _.min(BeeBot.colonies(), room => Game.map.getRoomLinearDistance(room.name, roomName));
                let scout = Process.getProcess<ProcessScout>(room.name, PROCESS_SCOUT);
                if (!scout) {
                    scout = new ProcessScout(room.name);
                    Process.startProcess(scout);
                }
                scout.requestScout(roomName);
            }
        })
    }

    private static handleObserves() {
        this.observeRequests = _.uniq(this.observeRequests);
        const observers = [...BeeBot.getObservers()];

        this.observeRequests.forEach(request => {
            if(!observers.length) return;
            const observer = observers.find(ob => Game.map.getRoomLinearDistance(request, ob.pos.roomName) <= 10);
            if(!observer) return;
            observer.observeRoom(request);
            _.remove(observers, ob => ob.id == observer.id);
        });
    }

    private static scanRoom(room: Room) {
        const type = Cartographer.roomType(room.name);
        const intel: RoomIntel = { time: Game.time };

        if (room.sources.length) intel.sources = room.sources.map(source => source.pos);
        switch (type) {
            case ROOMTYPE_CONTROLLER:
                const controller = room.controller!;
                intel.controller = controller.pos;
                intel.owner = controller.owner?.username;
                intel.rcl = controller.level;
                intel.mineral = room.mineral!.pos;
                intel.mineralType = room.mineral!.mineralType;
                break;
            case ROOMTYPE_HIGHEAY:
                if (room.powerBanks.length)
                    intel.powerBank = room.powerBanks.map(bank => ({ pos: bank.pos, power: bank.power }));
                if (room.deposits.length)
                    intel.deposit = room.deposits.map(
                        deposit => ({ pos: deposit.pos, type: deposit.depositType, cooldown: deposit.cooldown }));
                break;
            case ROOMTYPE_CORE:
            case ROOMTYPE_SOURCEKEEPER:
                intel.mineral = room.mineral!.pos;
                intel.mineralType = room.mineral!.mineralType;
                if (room.sourceKeepers.length) intel.keepers = room.sourceKeepers.map(keeper => keeper.pos);
                if (room.invaderCore) {
                    intel.invaderCore = room.invaderCore.pos;
                    intel.invaderLevel = room.invaderCore.level;
                }
                break;
            default:
                break;
        }

        this.dirty = true;
        return this.roomIntel[room.name] = intel;
    }

    private static generateCostMatrix(room: Room) {
        this.dirty = true;
        return this.roomCostMatrix[room.name] =
            Traveler.addStructuresToMatrix(room, new PathFinder.CostMatrix(), 1);
    }

    public static checkDirty(){
        return this.dirty;
    }

    public static resetDirty() {
        this.dirty = false;
    }

    public static serializeData() {
        if (!Object.keys(this.roomIntel).length) return;

        const result: { [roomName: string]: SerializedRoomIntel } = {};

        _.forEach(this.roomIntel, (intel, roomName) => {
            const serialized: SerializedRoomIntel = { t: packNumber(intel.time) };

            if (intel.rcl) serialized.r = intel.rcl;
            if (intel.sources) serialized.s = packCoordList(intel.sources);
            if (intel.mineral) serialized.m = packCoord(intel.mineral);
            if (intel.mineralType) serialized.mt = intel.mineralType;
            if (intel.controller) serialized.c = packCoord(intel.controller);
            if (intel.keepers) serialized.k = packCoordList(intel.keepers);

            result[packRoomName(roomName!)] = serialized;
        });

        SegmentManager.writeSegment(INTEL_SEGMENT, JSON.stringify(result));
    }

    public static deserializeData() {
        const data = SegmentManager.getSegment(INTEL_SEGMENT);
        if (!data) return;

        const parsed: { [roomName: string]: SerializedRoomIntel } = JSON.parse(data);
        _.forEach(parsed, (intel, roomName) => {
            const result: RoomIntel = { time: Number(unpackNumber(intel.t)) };

            if (intel.r) result.rcl = intel.r;
            if (intel.s) result.sources = unpackCoordList(intel.s);
            if (intel.m) result.mineral = unpackCoord(intel.m);
            if (intel.mt) result.mineralType = intel.mt;
            if (intel.c) result.controller = unpackCoord(intel.c);
            if (intel.k) result.keepers = unpackCoordList(intel.k);

            this.roomIntel[unpackRoomName(roomName!)] = result;
        });
    }
}