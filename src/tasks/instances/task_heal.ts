import {Task} from '../Task';

export type healTargetType = Creep;

export class TaskHeal extends Task {

	public static taskName = 'heal';
	public target: healTargetType;

	constructor(target: healTargetType, options = {} as TaskOptions) {
		super(TaskHeal.taskName, target, options);
		// Settings
		this.settings.targetRange = 3;
	}

	public isValidTask() {
		return (this.bee.getActiveBodyparts(HEAL) > 0);
	}

	public isValidTarget() {
		return this.target && this.target.hits < this.target.hitsMax && this.target.my;
	}

	public work() {
		if (this.bee.pos.isNearTo(this.target)) {
			return this.bee.heal(this.target);
		} else {
			this.moveToTarget(1);
		}
		return this.bee.rangedHeal(this.target);
	}
}
