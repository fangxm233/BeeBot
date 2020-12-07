import { USER_NAME } from "config";
import { isCommonStore } from "declarations/typeGuards";

// Universal reference properties

export function deref(ref: string): RoomObject | null { // dereference any object from identifier; see ref in RoomObjects
	return Game.getObjectById(ref) || Game.flags[ref] || Game.creeps[ref] || Game.spawns[ref] || null;
}

export function derefRoomPosition(protoPos: ProtoPos): RoomPosition {
	return new RoomPosition(protoPos.x, protoPos.y, protoPos.roomName);
}

export function coordToRoomPosition(coord: Coord, roomName: string) {
	return new RoomPosition(coord.x, coord.y, roomName);
}

export function getFreeCapacity(store: Store<ResourceConstant, any>, resourceType?: ResourceConstant): number {
	if (isCommonStore(store)) return store.getFreeCapacity();
	else return (store as StoreDefinition).getFreeCapacity(resourceType);
}

export function getCapacity(store: Store<ResourceConstant, any>, resourceType?: ResourceConstant): number {
	if (isCommonStore(store)) return store.getCapacity();
	return (store as StoreDefinition).getCapacity(resourceType) || 0;
}

export function timeAfterTick(tick: number): number {
	return Game.time + tick;
}

export function calBodyCost(body: BodyPartConstant[]) {
	return _.sum(body, b => BODYPART_COST[b]);
}

export function isOwner(object: any): boolean {
	return object.owner && object.owner.username == USER_NAME;
}

export function partCount(body: BodyPartConstant[], type: BodyPartConstant) {
	return _.countBy(body, body => body)[type] || 0;
}

export function hasAggressiveParts(creep: Creep): boolean {
	return !!creep.body.find(part => part.type != HEAL && part.type != MOVE && part.type != TOUGH && part.type != CARRY);
}