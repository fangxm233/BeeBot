import {Task} from '../Task';

export type upgradeTargetType = StructureController;

export class TaskUpgrade extends Task {

	public static taskName = 'upgrade';

	constructor(target: upgradeTargetType, options = {} as TaskOptions) {
		super(TaskUpgrade.taskName, target, options);
		// Settings
		this.settings.targetRange = 3;
		this.settings.workOffRoad = true;
	}

	public get target() {
		return super.target as upgradeTargetType;
	}

	public isValidTask() {
		return (this.bee.store.energy > 0);
	}

	public isValidTarget() {
		return this.target && this.target.my;
	}

	public work() {
		return this.bee.upgradeController(this.target);
	}
}

