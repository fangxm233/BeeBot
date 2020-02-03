import {Task} from '../Task';

export type repairTargetType = Structure;

export class TaskRepair extends Task {

	public static taskName = 'repair';
	public target: repairTargetType;

	constructor(target: repairTargetType, options = {} as TaskOptions) {
		super(TaskRepair.taskName, target, options);
		// Settings
		this.settings.targetRange = 3;
	}

	public isValidTask() {
		return this.creep.store.energy > 0;
	}

	public isValidTarget() {
		return this.target && this.target.hits < this.target.hitsMax;
	}

	public work() {
		const result = this.creep.repair(this.target);
		if (this.target.structureType == STRUCTURE_ROAD) {
			// prevents workers from idling for a tick before moving to next target
			const newHits = this.target.hits + this.creep.getActiveBodyparts(WORK) * REPAIR_POWER;
			if (newHits > this.target.hitsMax) {
				this.finish();
			}
		}
		return result;
	}
}
