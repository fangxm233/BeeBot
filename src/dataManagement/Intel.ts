import { BeeBot } from "BeeBot/BeeBot";
import { Traveler } from "movement/Traveler";
import { ProcessScouting } from "process/instances/scouting";
import { Process } from "process/Process";
import { PROCESS_SCOUTING } from "process/Processes";
import { profile } from "profiler/decorator";
import { Cartographer, ROOMTYPE_CONTROLLER, ROOMTYPE_CORE, ROOMTYPE_HIGHEAY, ROOMTYPE_SOURCEKEEPER } from "utilities/Cartographer";

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
}
interface SerializedRoomIntel {
    o?: string;
    r?: number;
    s?: string;
    m?: string;
    mt?: string;
    c?: string;

    k?: string;
}

@profile
export class Intel {
    private static roomIntel: { [roomName: string]: RoomIntel } = {};
    private static roomCostMatrix: { [roomName: string]: CostMatrix } = {};
    private static requests: { roomName: string, requestType: 'intel' | 'costMatrix' }[] = [];
    private static observeRequests: string[] = [];

    public static getRoomIntel(roomName: string): RoomIntel | undefined {
        return this.roomIntel[roomName];
    }

    public static requestRoomIntel(roomName: string) {
        this.requests.push({ roomName, requestType: 'intel' });
    }

    public static getRoomCostMatrix(roomName: string): CostMatrix | undefined {
        return this.roomCostMatrix[roomName];
    }

    public static requestRoomCostMatrix(roomName: string) {
        this.requests.push({ roomName, requestType: 'costMatrix' });
    }

    public static requestObserve(roomName: string) {
        this.observeRequests.push(roomName);
    }

    public static handleRequests() {
        this.requests = _.uniq(this.requests, request => request.roomName);

        for (let i = 0; i < this.requests.length; i++) {
            const request = this.requests[i];
            const room = Game.rooms[request.roomName];
            if (!room) {
                if (BeeBot.getObservers().length) {
                    this.requestObserve(request.roomName);
                } else {
                    const room = _.min(BeeBot.myRooms(), room => Game.map.getRoomLinearDistance(room.name, request.roomName));
                    const scouting = Process.getProcess<ProcessScouting>(room.name, PROCESS_SCOUTING);

                }
            } else {
                this.scanRoom(room);
                if (request.requestType == 'costMatrix') this.generateCostMatrix(room);
                this.requests.splice(i--);
            }
        }

        this.handleObserves();
    }

    private static handleObserves() {
        this.observeRequests = _.uniq(this.observeRequests);

    }

    private static scanRoom(room: Room) {
        const type = Cartographer.roomType(room.name);
        const intel: RoomIntel = {};

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

        this.roomIntel[room.name] = intel;
    }

    private static generateCostMatrix(room: Room) {
        this.roomCostMatrix[room.name] =
            Traveler.addStructuresToMatrix(room, new PathFinder.CostMatrix(), 1);
    }
}