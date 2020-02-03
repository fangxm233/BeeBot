import { TargetCache } from "../caching/caching";

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

Object.defineProperty(RoomObject.prototype, 'ref', {
	get () {
		return this.id || this.name || '';
	},
});

Object.defineProperty(RoomObject.prototype, 'targetedBy', {
	get () {
		// Check that target cache has been initialized - you can move this to execute once per tick if you want
		TargetCache.assert();
		return _.map(Game.TargetCache.targets[this.ref], name => Game.creeps[name]);
	},
});