interface Coord {
    x: number;
    y: number;
}

interface RoomCoord {
    x: number;
    y: number;
    xDir: string;
    yDir: string;
}

interface HasPos {
    pos: RoomPosition;
}

interface ProtoRoomObject {
    ref: string;
    pos: ProtoPos;
}

interface ProtoPos {
    x: number;
    y: number;
    roomName: string;
}

interface TravelToReturnData {
    nextPos?: RoomPosition;
    pathfinderReturn?: PathfinderReturn;
    state?: TravelState;
    path?: string;
}

interface TravelToOptions {
    ignoreRoads?: boolean;
    ignoreCreeps?: boolean;
    ignoreStructures?: boolean;
    preferHighway?: boolean;
    highwayBias?: number;
    allowHostile?: boolean;
    allowSK?: boolean;
    range?: number;
    obstacles?: { pos: RoomPosition }[];
    roomCallback?: (roomName: string, matrix: CostMatrix) => CostMatrix | boolean;
    routeCallback?: (roomName: string) => number;
    matrix?: CostMatrix;
    // returnData?: TravelToReturnData;
    restrictDistance?: number;
    useFindRoute?: boolean;
    maxOps?: number;
    movingTarget?: boolean;
    freshMatrix?: boolean;
    offRoad?: boolean;
    stuckValue?: number;
    maxRooms?: number;
    repath?: number;
    route?: { [roomName: string]: boolean };
    ensurePath?: boolean;
    pushCreep?: boolean;
}

interface TravelData {
    path: string;
}

interface TravelState {
    stuckCount: number;
    lastCoord: Coord;
    destination: RoomPosition;
    cpu: number;
}

interface PathfinderReturn {
    path: RoomPosition[];
    ops: number;
    cost: number;
    incomplete: boolean;
}

interface TaskSettings {
    oneShot: boolean;
    targetRange: number;
    workOffRoad: boolean;
}

interface TaskOptions {
    blind?: boolean;
    nextPos?: ProtoPos;
    moveOptions?: TravelToOptions;
    // moveOptions: TravelToOptions; // <- uncomment this line if you use Traveler
}

interface TaskData {
    quiet?: boolean;
    resourceType?: string;
    amount?: number;
    signature?: string;
    skipEnergy?: boolean;
}

interface protoTask {
    name: string;
    _creep: {
        name: string;
    };
    _target: {
        ref: string;
        _pos: ProtoPos;
    };
    _parent: protoTask | null;
    options: TaskOptions;
    data: TaskData;
    tick: number;
}

interface protoAllotUnit {
    available: boolean;
    roomName: string;
    typeId: number;
    id: number;
    data: any;
}

enum PriorityLevel {
    level1,
    level2,
    level3,
    level4,
    level5,
    level6,
    level7,
    level8,
    level9,
    level10
}

interface StoreStructure extends Structure {
    store: StoreDefinition;
}

interface TypeToStructure {
    extension: StructureExtension;
    rampart: StructureRampart;
    road: StructureRoad;
    spawn: StructureSpawn;
    link: StructureLink;
    constructedWall: StructureWall;
    storage: StructureStorage;
    tower: StructureTower;
    observer: StructureObserver;
    powerSpawn: StructurePowerSpawn;
    extractor: StructureExtractor;
    lab: StructureLab;
    terminal: StructureTerminal;
    container: StructureContainer;
    nuker: StructureNuker;
    factory: StructureFactory;
    invaderCore: StructureInvaderCore;
    keeperLair: StructureKeeperLair;
    controller: StructureController;
    powerBank: StructurePowerBank;
    portal: StructurePortal;
}