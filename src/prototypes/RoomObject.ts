// RoomObject prototypes

RoomObject.prototype.serialize = function(): ProtoRoomObject {
	const pos: ProtoPos = {
		x       : this.pos.x,
		y       : this.pos.y,
		roomName: this.pos.roomName
	};
	return {
		pos,
		ref: this.ref
	};
};
