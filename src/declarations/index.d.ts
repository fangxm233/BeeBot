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
    obstacles?: {pos: RoomPosition}[];
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
    route?: {[roomName: string]: boolean};
    ensurePath?: boolean;
    pushCreep?: boolean;
}

interface TravelData {
    state: any[];
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
	moveOptions?: MoveToOpts;
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

interface ITask extends protoTask {
	settings: TaskSettings;
	proto: protoTask;
	creep: Creep;
	target: RoomObject | null;
	targetPos: RoomPosition;
	parent: ITask | null;
	manifest: ITask[];
	targetManifest: (RoomObject | null)[];
	targetPosManifest: RoomPosition[];
	eta: number | undefined;

	fork(newTask: ITask): ITask;

	isValidTask(): boolean;

	isValidTarget(): boolean;

	isValid(): boolean;

	moveToTarget(range?: number): number;

	run(): number | void;

	work(): number;

	finish(): void;
}