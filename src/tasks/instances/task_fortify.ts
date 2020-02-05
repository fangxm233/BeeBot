import {Task} from '../Task';

export type fortifyTargetType = StructureWall | StructureRampart;

export class TaskFortify extends Task {

	public static taskName = 'fortify';
	public target: fortifyTargetType;

	constructor(target: fortifyTargetType, options = {} as TaskOptions) {
		super(TaskFortify.taskName, target, options);
		// Settings
		this.settings.targetRange = 3;
		this.settings.workOffRoad = true;
	}

	public isValidTask() {
		return (this.bee.store.energy > 0);
	}

	public isValidTarget() {
		const target = this.target;
		return (target != null && target.hits < target.hitsMax); // over-fortify to minimize extra trips
	}

	public work() {
		return this.bee.repair(this.target);
	}
}
