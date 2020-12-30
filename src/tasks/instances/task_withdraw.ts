/* This is the withdrawal task for non-energy resources. */

import { Task } from '../Task';

import { isStoreStructure } from 'declarations/typeGuards';

export type withdrawTargetType =
	| StoreStructure
	| StructureLab
	| StructureNuker
	| StructurePowerSpawn
	| Tombstone
	| Ruin;

export class TaskWithdraw extends Task {

	public static taskName = 'withdraw';
	public target: withdrawTargetType;
	public data: {
		resourceType: ResourceConstant,
		amount: number | undefined,
	};

	constructor(target: withdrawTargetType,
		resourceType: ResourceConstant = RESOURCE_ENERGY,
		amount: number | undefined = undefined,
		options = {} as TaskOptions) {
		super(TaskWithdraw.taskName, target, options);
		// Settings
		this.settings.oneShot = true;
		this.data.resourceType = resourceType;
		this.data.amount = amount;
	}

	public isValidTask() {
		const amount = this.data.amount || 1;
		return this.bee.store.getFreeCapacity() >= amount;
	}

	public isValidTarget() {
		const amount = this.data.amount || 1;
		const target = this.target;
		if (isStoreStructure(target)) {
			return (target.store[this.data.resourceType] || 0) >= amount;
		}
		return false;
	}

	public work() {
		return this.bee.withdraw(this.target, this.data.resourceType, this.data.amount);
	}

}

