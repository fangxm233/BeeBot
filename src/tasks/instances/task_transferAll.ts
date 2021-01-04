import {Task} from '../Task';


export type transferAllTargetType = StructureStorage | StructureTerminal | StructureContainer;

export class TaskTransferAll extends Task {

	public static taskName = 'transferAll';

	public data: {
		skipEnergy?: boolean;
	};

	constructor(target: transferAllTargetType, skipEnergy = false, options = {} as TaskOptions) {
		super(TaskTransferAll.taskName, target, options);
		this.data.skipEnergy = skipEnergy;
	}

	public get target() {
		return super.target as transferAllTargetType;
	}

	public isValidTask() {
		for (const resourceType in this.bee.store) {
			if (this.data.skipEnergy && resourceType == RESOURCE_ENERGY) {
				continue;
			}
			const amountInStore = this.bee.store.getUsedCapacity(resourceType as ResourceConstant);
			if (amountInStore > 0) {
				return true;
			}
		}
		return false;
	}

	public isValidTarget() {
		return this.target.store.getFreeCapacity() > 0;
	}

	public work() {
		for (const resourceType in this.bee.store) {
			if (this.data.skipEnergy && resourceType == RESOURCE_ENERGY) {
				continue;
			}
			const amountInStore = this.bee.store.getUsedCapacity(resourceType as ResourceConstant);
			if (amountInStore > 0) {
				return this.bee.transfer(this.target, resourceType as ResourceConstant);
			}
		}
		return -1;
	}
}
