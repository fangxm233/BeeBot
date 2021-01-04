// TaskDismantle: dismantles a structure

import {Task} from '../Task';

export type dismantleTargetType = Structure;

export class TaskDismantle extends Task {
	public static taskName = 'dismantle';

	constructor(target: dismantleTargetType, options = {} as TaskOptions) {
		super(TaskDismantle.taskName, target, options);
	}

	public get target() {
		return super.target as dismantleTargetType;
	}

	public isValidTask() {
		return (this.bee.getActiveBodyparts(WORK) > 0);
	}

	public isValidTarget() {
		return this.target && this.target.hits > 0;
	}

	public work() {
		return this.bee.dismantle(this.target);
	}
}
