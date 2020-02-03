interface Game {
	TargetCache: {
		tick: number;
		targets: { [ref: string]: string[] };
		build(): void;
	}
}

interface TaskSettings {
	oneShot: boolean;
	targetRange: number;
	workOffRoad: boolean;
}

interface TaskOptions {
	blind?: boolean;
	nextPos?: protoPos;
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
		_pos: protoPos;
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

interface CreepMemory {
	task: protoTask | null;
}

interface Creep {
	task: ITask | null;
	hasValidTask: boolean;
	isIdle: boolean;

	run(): number | void;
}

interface protoPos {
	x: number;
	y: number;
	roomName: string;
}

interface RoomObject {
	ref: string;
	targetedBy: Creep[];
}

interface RoomPosition {
	isEdge: boolean;

	isPassible(ignoreCreeps?: boolean): boolean;

	availableNeighbors(ignoreCreeps?: boolean): RoomPosition[];
}