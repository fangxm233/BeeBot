import {Task} from '../Task';

export type reserveTargetType = StructureController;

export class TaskReserve extends Task {

	public static taskName = 'reserve';

	constructor(target: reserveTargetType, options = {} as TaskOptions) {
		super(TaskReserve.taskName, target, options);
	}

	public get target() {
		return super.target as reserveTargetType;
	}

	public isValidTask() {
		return (this.bee.getActiveBodyparts(CLAIM) > 0);
	}

	public isValidTarget() {
		const target = this.target;
		return (target != null && !target.owner && (!target.reservation || target.reservation.ticksToEnd < 4999));
	}

	public work() {
		return this.bee.reserveController(this.target);
	}
}
