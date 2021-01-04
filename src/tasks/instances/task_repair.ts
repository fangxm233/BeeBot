import {Task} from '../Task';

export type repairTargetType = Structure;

export class TaskRepair extends Task {

	public static taskName = 'repair';

	constructor(target: repairTargetType, options = {} as TaskOptions) {
		super(TaskRepair.taskName, target, options);
		// Settings
		this.settings.targetRange = 3;
	}

	public get target() {
		return super.target as repairTargetType;
	}

	public isValidTask() {
		return this.bee.store.energy > 0;
	}

	public isValidTarget() {
		return this.target && this.target.hits < this.target.hitsMax;
	}

	public work() {
		const result = this.bee.repair(this.target);
		if (this.target.structureType == STRUCTURE_ROAD) {
			// prevents workers from idling for a tick before moving to next target
			const newHits = this.target.hits + this.bee.getActiveBodyparts(WORK) * REPAIR_POWER;
			if (newHits > this.target.hitsMax) {
				this.finish();
			}
		}
		return result;
	}
}
