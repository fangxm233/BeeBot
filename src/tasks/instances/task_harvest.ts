import {Task} from '../Task';

export type harvestTargetType = Source | Mineral;

function isSource(obj: Source | Mineral): obj is Source {
	return (obj as Source).energy != undefined;
}

export class TaskHarvest extends Task {

	public static taskName = 'harvest';
	public target: harvestTargetType;

	constructor(target: harvestTargetType, options = {} as TaskOptions) {
		super(TaskHarvest.taskName, target, options);
	}

	public isValidTask() {
		return this.creep.store.getFreeCapacity() > 0;
	}

	public isValidTarget() {
		// if (this.target && (this.target instanceof Source ? this.target.energy > 0 : this.target.mineralAmount > 0)) {
		// 	// Valid only if there's enough space for harvester to work - prevents doing tons of useless pathfinding
		// 	return this.target.pos.availableNeighbors().length > 0 || this.creep.pos.isNearTo(this.target.pos);
		// }
		// return false;
		if (isSource(this.target)) {
			return this.target.energy > 0;
		} else {
			return this.target.mineralAmount > 0;
		}
	}

	public work() {
		return this.creep.harvest(this.target);
	}
}

