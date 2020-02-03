// Universal reference properties

export function deref(ref: string): RoomObject | null { // dereference any object from identifier; see ref in RoomObjects
	return Game.getObjectById(ref) || Game.flags[ref] || Game.creeps[ref] || Game.spawns[ref] || null;
}

export function derefRoomPosition(protoPos: protoPos): RoomPosition {
	return new RoomPosition(protoPos.x, protoPos.y, protoPos.roomName);
}