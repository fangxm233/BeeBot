import {Task} from '../Task';

export type upgradeTargetType = StructureController;

export class TaskUpgrade extends Task {

	public static taskName = 'upgrade';
	public target: upgradeTargetType;

	constructor(target: upgradeTargetType, options = {} as TaskOptions) {
		super(TaskUpgrade.taskName, target, options);
		// Settings
		this.settings.targetRange = 3;
		this.settings.workOffRoad = true;
	}

	public isValidTask() {
		return (this.creep.store.energy > 0);
	}

	public isValidTarget() {
		return this.target && this.target.my;
	}

	public work() {
		return this.creep.upgradeController(this.target);
	}
}

