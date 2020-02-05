import {Task} from '../Task';


export type withdrawAllTargetType = StructureStorage | StructureTerminal | StructureContainer | Tombstone;

export class TaskWithdrawAll extends Task {

	public static taskName = 'withdrawAll';
	public target: withdrawAllTargetType;

	constructor(target: withdrawAllTargetType, options = {} as TaskOptions) {
		super(TaskWithdrawAll.taskName, target, options);
	}

	public isValidTask() {
		return this.bee.store.getFreeCapacity() > 0;
	}

	public isValidTarget() {
		return this.target.store.getUsedCapacity() > 0;
	}

	public work() {
		for (const resourceType in this.target.store) {
			const amountInStore = this.target.store[resourceType as ResourceConstant] || 0;
			if (amountInStore > 0) {
				return this.bee.withdraw(this.target, resourceType as ResourceConstant);
			}
		}
		return -1;
	}
}
