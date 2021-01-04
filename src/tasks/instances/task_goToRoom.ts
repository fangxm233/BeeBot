import {Task} from '../Task';

export type goToRoomTargetType = string;

export class TaskGoToRoom extends Task {
	public static taskName = 'goToRoom';

	constructor(roomName: goToRoomTargetType, options = {} as TaskOptions) {
		super(TaskGoToRoom.taskName, {ref: '', pos: new RoomPosition(25, 25, roomName)}, options);
		// Settings
		this.settings.targetRange = 24; // Target is almost always controller flag, so range of 2 is acceptable
	}

	public get target() {
		return super.target as null;
	}

	public isValidTask() {
		return !this.bee.pos.inRangeTo(this.targetPos, this.settings.targetRange);
	}

	public isValidTarget() {
		return true;
	}

	public isValid(): boolean {
		// It's necessary to override task.isValid() for tasks which do not have a RoomObject target
		let validTask = false;
		if (this.bee) {
			validTask = this.isValidTask();
		}
		// Return if the task is valid; if not, finalize/delete the task and return false
		if (validTask) {
			return true;
		} else {
			// Switch to parent task if there is one
			let isValid = false;
			if (this.parent) {
				isValid = this.parent.isValid();
			}
			this.finish();
			return isValid;
		}
	}

	public work() {
		return OK;
	}
}

