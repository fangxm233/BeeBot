// TaskDismantle: dismantles a structure

import {Task} from '../Task';

export type dismantleTargetType = Structure;

export class TaskDismantle extends Task {
	public static taskName = 'dismantle';
	public target: dismantleTargetType;

	constructor(target: dismantleTargetType, options = {} as TaskOptions) {
		super(TaskDismantle.taskName, target, options);
	}

	public isValidTask() {
		return (this.creep.getActiveBodyparts(WORK) > 0);
	}

	public isValidTarget() {
		return this.target && this.target.hits > 0;
	}

	public work() {
		return this.creep.dismantle(this.target);
	}
}
