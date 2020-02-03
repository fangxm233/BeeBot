import {Task} from '../Task';

import { isCommonStore, isStoreStructure, StoreStructure } from 'declarations/typeGuards';

export type transferTargetType =
	| StoreStructure
	| StructureLab
	| StructureNuker
	| StructurePowerSpawn
	| Creep;

export class TaskTransfer extends Task {

	public static taskName = 'transfer';

	public target: transferTargetType;
	public data: {
		resourceType: ResourceConstant
		amount: number | undefined
	};

	constructor(target: transferTargetType,
				resourceType: ResourceConstant = RESOURCE_ENERGY,
				amount: number | undefined     = undefined,
				options                        = {} as TaskOptions) {
		super(TaskTransfer.taskName, target, options);
		// Settings
		this.settings.oneShot = true;
		this.data.resourceType = resourceType;
		this.data.amount = amount;
	}

	public isValidTask() {
		const amount = this.data.amount || 1;
		const resourcesInStore = this.creep.store[this.data.resourceType] || 0;
		return resourcesInStore >= amount;
	}

	public isValidTarget() {
		const amount = this.data.amount || 1;
		const target = this.target;
		if (isStoreStructure(target)) {
			const store = target.store;
			if(isCommonStore(store)) {
				return store.getFreeCapacity() >= amount;
			}
			return (store as Store<any, false>).getFreeCapacity(this.data.resourceType) >= amount;
		}
		return false;
	}

	public work() {
		return this.creep.transfer(this.target, this.data.resourceType, this.data.amount);
	}
}
