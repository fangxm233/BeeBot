import { initializeTask } from "tasks/initializer";
import { TargetCache } from "../caching/caching";

// Creep properties ====================================================================================================

// Boosting logic ------------------------------------------------------------------------------------------------------

Object.defineProperty(Creep.prototype, 'boosts', {
	get() {
		if (!this._boosts) {
			this._boosts = _.compact(_.unique(_.map(this.body as BodyPartDefinition[],
													bodyPart => bodyPart.boost))) as _ResourceConstantSansEnergy[];
		}
		return this._boosts;
		// return _.compact(_.unique(_.map(this.body as BodyPartDefinition[],
		// 								bodyPart => bodyPart.boost))) as _ResourceConstantSansEnergy[];
	},
	configurable: true,
});

Object.defineProperty(Creep.prototype, 'boostCounts', {
	get() {
		if (!this._boostCounts) {
			this._boostCounts = _.countBy(this.body as BodyPartDefinition[], bodyPart => bodyPart.boost);
		}
		return this._boostCounts;
	},
	configurable: true,
});

Object.defineProperty(Creep.prototype, 'inRampart', {
	get() {
		return !!this.pos.lookForStructure(STRUCTURE_RAMPART); // this assumes hostile creeps can't stand in my ramparts
	},
	configurable: true,
});

Object.defineProperties(Creep.prototype, {
	'hasValidTask': {
		get() {
			return this.task && this.task.isValid();
		}
	},
	'isIdle'      : {
		get() {
			return !this.hasValidTask;
		}
	}
});

Object.defineProperty(Creep.prototype, 'task', {
	get() {
		if (!this._task) {
			const protoTask = this.memory.task;
			this._task = protoTask ? initializeTask(protoTask) : null;
		}
		return this._task;
	},
	set(task: ITask | null) {
		// Assert that there is an up-to-date target cache
		TargetCache.assert();
		// Unregister target from old task if applicable
		const oldProtoTask = this.memory.task as protoTask;
		if (oldProtoTask) {
			const oldRef = oldProtoTask._target.ref;
			if (Game.TargetCache.targets[oldRef]) {
				_.remove(Game.TargetCache.targets[oldRef], name => name == this.name);
			}
		}
		// Set the new task
		this.memory.task = task ? task.proto : null;
		if (task) {
			if (task.target) {
				// Register task target in cache if it is actively targeting something (excludes goTo and similar)
				if (!Game.TargetCache.targets[task.target.ref]) {
					Game.TargetCache.targets[task.target.ref] = [];
				}
				Game.TargetCache.targets[task.target.ref].push(this.name);
			}
			// Register references to creep
			task.creep = this;
		}
		// Clear cache
		this._task = null;
	},
});

Creep.prototype.run = function (): void {
	if (this.task) {
		return this.task.run();
	}
};