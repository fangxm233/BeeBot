// Caches targets every tick to allow for RoomObject.targetedBy property

export class TargetCache {

	public targets: { [ref: string]: string[] };
	public tick: number;

	constructor() {
		this.targets = {};
		this.tick = Game.time; // record last refresh
	}

	// Generates a hash table for targets: key: TargetRef, val: targeting creep names
	private cacheTargets() {
		this.targets = {};
		for (const i in Game.creeps) {
			const creep = Game.creeps[i];
			let task = creep.memory.task;
			// Perform a faster, primitive form of _.map(creep.task.manifest, task => task.target.ref)
			while (task) {
				if (!this.targets[task._target.ref]) this.targets[task._target.ref] = [];
				this.targets[task._target.ref].push(creep.name);
				task = task._parent;
			}
		}
	}

	// Assert that there is an up-to-date target cache
	public static assert() {
		if (!(Game.TargetCache && Game.TargetCache.tick == Game.time)) {
			Game.TargetCache = new TargetCache();
			Game.TargetCache.build();
		}
	}

	// Build the target cache
	public build() {
		this.cacheTargets();
	}
}

