import {Task} from '../Task';

export type meleeAttackTargetType = Creep | Structure;

export class TaskMeleeAttack extends Task {

	public static taskName = 'meleeAttack';
	public target: meleeAttackTargetType;

	constructor(target: meleeAttackTargetType, options = {} as TaskOptions) {
		super(TaskMeleeAttack.taskName, target, options);
		// Settings
		this.settings.targetRange = 1;
	}

	public isValidTask() {
		return this.bee.getActiveBodyparts(ATTACK) > 0;
	}

	public isValidTarget() {
		return this.target && this.target.hits > 0;
	}

	public work() {
		return this.bee.attack(this.target);
	}
}

