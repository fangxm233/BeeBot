interface Creep {
	memory: CreepMemory;
	hitsLost: number;
	boosts: _ResourceConstantSansEnergy[];
	boostCounts: { [boostType: string]: number };
	bodyCounts: { [bodyType: string]: number };
	inRampart: boolean;
}

interface PowerCreep {
	travelTo(destination: HasPos | RoomPosition, ops?: TravelToOptions): number;
	moveOffExit(): void;
}

interface ConstructionSite {
	isWalkable: boolean;
}

interface Flag {

}

type StorageUnit = StructureContainer | StructureTerminal | StructureStorage;

type rechargeObjectType = StructureStorage
	| StructureTerminal
	| StructureContainer
	| StructureLink
	| Tombstone
	| Ruin
	| Resource;

interface Room {
	print: string;
	my: boolean;
	owner: string | undefined;
	reservedByMe: boolean;
	// signedByMe: boolean;
	creeps: Creep[];
	sourceKeepers: Creep[];
	hostiles: Creep[];
	dangerousHostiles: Creep[];
	playerHostiles: Creep[];
	invaders: Creep[];
	dangerousPlayerHostiles: Creep[];
	hostileStructures: Structure[];
	structures: Structure[];
	flags: Flag[];
	// Cached structures
	tombstones: Tombstone[];
	ruins: Ruin[];
	drops: { [resourceType: string]: Resource[] };
	droppedEnergy: Resource[];
	droppedPower: Resource[];
	// Room structures
	_refreshStructureCache;
	// Multiple structures
	spawns: StructureSpawn[];
	extensions: StructureExtension[];
	roads: StructureRoad[];
	walls: StructureWall[];
	constructedWalls: StructureWall[];
	ramparts: StructureRampart[];
	walkableRamparts: StructureRampart[];
	barriers: (StructureWall | StructureRampart)[];
	storageUnits: StorageUnit[];
	keeperLairs: StructureKeeperLair[];
	portals: StructurePortal[];
	links: StructureLink[];
	towers: StructureTower[];
	labs: StructureLab[];
	containers: StructureContainer[];
	powerBanks: StructurePowerBank[];
	// Single structures
	observer: StructureObserver | undefined;
	powerSpawn: StructurePowerSpawn | undefined;
	extractor: StructureExtractor | undefined;
	nuker: StructureNuker | undefined;
	factory: StructureFactory | undefined;
	invaderCore: StructureInvaderCore | undefined;

	repairables: Structure[];
	rechargeables: rechargeObjectType[];
	sources: Source[];
	mineral: Mineral | undefined;
	deposits: Deposit[];
	constructionSites: ConstructionSite[];
}

interface RoomObject {
	ref: string;
	targetedBy: Creep[];

	serialize(): ProtoRoomObject;
}

interface RoomPosition {
	print: string;
	printPlain: string;
	room: Room | undefined;
	name: string;
	coordName: string;
	isEdge: boolean;
	isVisible: boolean;
	rangeToEdge: number;
	roomCoords: Coord;
	neighbors: RoomPosition[];

	inRangeToPos(pos: RoomPosition, range: number): boolean;

	inRangeToXY(x: number, y: number, range: number): boolean;

	getRangeToXY(x: number, y: number): number;

	getPositionsAtRange(range: number, includeWalls?: boolean, includeEdges?: boolean): RoomPosition[];

	getPositionsInRange(range: number, includeWalls?: boolean, includeEdges?: boolean): RoomPosition[];

	getOffsetPos(dx: number, dy: number): RoomPosition;

	lookForStructure<T extends StructureConstant>(structureType: T): TypeToStructure[T] | undefined;

	isWalkable(ignoreCreeps?: boolean, ignoreStructures?: boolean): boolean;

	availableNeighbors(ignoreCreeps?: boolean, ignoreStructures?: boolean): RoomPosition[];

	getPositionAtDirection(direction: DirectionConstant, range?: number): RoomPosition;

	getMultiRoomRangeTo(pos: RoomPosition): number;

	findClosestByLimitedRange<T>(objects: T[] | RoomPosition[], rangeLimit: number,
		opts?: { filter: any | string; }): T | undefined;

	findClosestByMultiRoomRange<T extends _HasRoomPosition>(objects: T[]): T | undefined;

	findClosestByRangeThenPath<T extends _HasRoomPosition>(objects: T[]): T | undefined;
}

interface RoomVisual {
	box(x: number, y: number, w: number, h: number, style?: LineStyle): RoomVisual;

	infoBox(info: string[], x: number, y: number, opts?: { [option: string]: any }): RoomVisual;

	multitext(textLines: string[], x: number, y: number, opts?: { [option: string]: any }): RoomVisual;

	structure(x: number, y: number, type: string, opts?: { [option: string]: any }): RoomVisual;

	connectRoads(opts?: { [option: string]: any }): RoomVisual | void;

	speech(text: string, x: number, y: number, opts?: { [option: string]: any }): RoomVisual;

	animatedPosition(x: number, y: number, opts?: { [option: string]: any }): RoomVisual;

	resource(type: ResourceConstant, x: number, y: number, size?: number, opacity?: number): number;

	_fluid(type: string, x: number, y: number, size?: number, opacity?: number): void;

	_mineral(type: string, x: number, y: number, size?: number, opacity?: number): void;

	_compound(type: string, x: number, y: number, size?: number, opacity?: number): void;

	test(): RoomVisual;
}

interface Structure {
	isWalkable: boolean;
}

interface StructureContainer {
	energy: number;
	isFull: boolean;
	isEmpty: boolean;
}

interface StructureController {
	reservedByMe: boolean;
	signedByMe: boolean;
	signedByScreeps: boolean;

	needsReserving(reserveBuffer: number): boolean;
}

interface StructureExtension {
	isFull: boolean;
	isEmpty: boolean;
}

interface StructureLink {
	isFull: boolean;
	isEmpty: boolean;
}

interface StructureStorage {
	energy: number;
	isFull: boolean;
	isEmpty: boolean;
}

interface StructureSpawn {
	isFull: boolean;
	isEmpty: boolean;
}

interface StructureTerminal {
	energy: any;
	isFull: boolean;
	isEmpty: boolean;
}

interface StructureTower {
	isFull: boolean;
	isEmpty: boolean;
}

interface Tombstone {
	energy: number;
}

interface Ruin {
	energy: number;
	power: number;
}