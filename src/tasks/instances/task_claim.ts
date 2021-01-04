// TaskClaim: claims a new controller

import {Task} from '../Task';

export type claimTargetType = StructureController;

export class TaskClaim extends Task {
	public static taskName = 'claim';

	constructor(target: claimTargetType, options = {} as TaskOptions) {
		super(TaskClaim.taskName, target, options);
		// Settings
	}

	public get target() {
		return super.target as claimTargetType;
	}

	public isValidTask() {
		return (this.bee.getActiveBodyparts(CLAIM) > 0);
	}

	public isValidTarget() {
		return (this.target != null && (!this.target.room || !this.target.owner));
	}

	public work() {
		return this.bee.claimController(this.target);
	}
}
