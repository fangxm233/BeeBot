import {Task} from '../Task';

export type goToTargetType = { pos: RoomPosition } | RoomPosition;

function hasPos(obj: { pos: RoomPosition } | RoomPosition): obj is { pos: RoomPosition } {
	return (obj as { pos: RoomPosition }).pos != undefined;
}

export class TaskGoTo extends Task {
	public static taskName = 'goTo';
	public target: null;

	constructor(target: goToTargetType, options = {} as TaskOptions) {
		if (hasPos(target)) {
			super(TaskGoTo.taskName, {ref: '', pos: target.pos}, options);
		} else {
			super(TaskGoTo.taskName, {ref: '', pos: target}, options);
		}
		// Settings
		this.settings.targetRange = 1;
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
