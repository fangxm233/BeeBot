import {Task} from '../Task';

export type reserveTargetType = StructureController;

export class TaskReserve extends Task {

	public static taskName = 'reserve';
	public target: reserveTargetType;

	constructor(target: reserveTargetType, options = {} as TaskOptions) {
		super(TaskReserve.taskName, target, options);
	}

	public isValidTask() {
		return (this.creep.getActiveBodyparts(CLAIM) > 0);
	}

	public isValidTarget() {
		const target = this.target;
		return (target != null && !target.owner && (!target.reservation || target.reservation.ticksToEnd < 4999));
	}

	public work() {
		return this.creep.reserveController(this.target);
	}
}
