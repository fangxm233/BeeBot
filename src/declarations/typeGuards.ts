// Type guards library: this allows for instanceof - like behavior for much lower CPU cost. Each type guard
// differentiates an ambiguous input by recognizing one or more unique properties.

export interface StoreStructure extends Structure {
	store: StoreDefinition;
}

export function isStoreStructure(obj: RoomObject): obj is StoreStructure {
	return (obj as StoreStructure).store !== undefined;
}

export function isStructure(obj: RoomObject): obj is Structure {
	return (obj as Structure).structureType !== undefined && ((obj as ConstructionSite).progress === undefined || (obj as StructureController).unclaim !== undefined);
}

export function isCommonStore(store: Store<ResourceConstant, any>): store is StoreDefinition {
	return store.getCapacity() !== null;
}

export function isOwnedStructure(structure: Structure): structure is OwnedStructure {
	return (structure as OwnedStructure).owner !== undefined;
}

export function isSource(obj: Source | Mineral): obj is Source {
	return (obj as Source).energy !== undefined;
}

export function isTombstone(obj: RoomObject): obj is Tombstone {
	return (obj as Tombstone).deathTime !== undefined;
}

export function isRuin(obj: RoomObject): obj is Ruin {
	return (obj as Ruin).destroyTime !== undefined;
}

export function isResource(obj: RoomObject): obj is Resource {
	return (obj as Resource).amount !== undefined;
}

export function hasPos(obj: HasPos | RoomPosition): obj is HasPos {
	return (obj as HasPos).pos !== undefined;
}

export function isCreep(obj: RoomObject): obj is Creep {
	return (obj as Creep).fatigue !== undefined;
}

export function isPowerCreep(obj: RoomObject): obj is PowerCreep {
	return (obj as PowerCreep).powers !== undefined;
}