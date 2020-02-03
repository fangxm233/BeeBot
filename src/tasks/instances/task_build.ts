// TaskBuild: builds a construction site until creep has no energy or site is complete

import {Task} from '../Task';

export type buildTargetType = ConstructionSite;

export class TaskBuild extends Task {

	public static taskName = 'build';
	public target: buildTargetType;

	constructor(target: buildTargetType, options = {} as TaskOptions) {
		super(TaskBuild.taskName, target, options);
		// Settings
		this.settings.targetRange = 3;
		this.settings.workOffRoad = true;
	}

	public isValidTask() {
		return this.creep.store.energy > 0;
	}

	public isValidTarget() {
		return this.target && this.target.my && this.target.progress < this.target.progressTotal;
	}

	public work() {
		return this.creep.build(this.target);
	}
}
