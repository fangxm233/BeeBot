import { isCommonStore } from "declarations/typeGuards";

// Universal reference properties

export function deref(ref: string): RoomObject | null { // dereference any object from identifier; see ref in RoomObjects
	return Game.getObjectById(ref) || Game.flags[ref] || Game.creeps[ref] || Game.spawns[ref] || null;
}

export function derefRoomPosition(protoPos: ProtoPos): RoomPosition {
	return new RoomPosition(protoPos.x, protoPos.y, protoPos.roomName);
}

export function getFreeCapacity(store: Store<any, any>, resourceType?: ResourceConstant): number{
	if(isCommonStore(store)) return store.getFreeCapacity();
	else return store.getFreeCapacity(resourceType);
}

export function getCapacity(store: Store<any, any>, resourceType?: ResourceConstant): number{
	if(isCommonStore(store)) return store.getCapacity();
	return store.getCapacity(resourceType) || 0;
}