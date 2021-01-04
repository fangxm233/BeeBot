import {Task} from '../Task';

export type pickupTargetType = Resource;

export class TaskPickup extends Task {

	public static taskName = 'pickup';

	constructor(target: pickupTargetType, options = {} as TaskOptions) {
		super(TaskPickup.taskName, target, options);
		this.settings.oneShot = true;
	}

	public get target() {
		return super.target as pickupTargetType;
	}

	public isValidTask() {
		return this.bee.store.getFreeCapacity() > 0;
	}

	public isValidTarget() {
		return this.target && this.target.amount > 0;
	}

	public work() {
		return this.bee.pickup(this.target);
	}
}
