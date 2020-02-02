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