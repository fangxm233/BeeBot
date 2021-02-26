interface Game {
	TargetCache: {
		tick: number;
		targets: { [ref: string]: string[] };
		build(): void;
	}
}

const enum Bucket {
	bottom = 1000,
	level1 = 1500,
	level2 = 2000,
	level3 = 2500,
	level4 = 3000,
	level5 = 3500,
	level6 = 4000,
	top = 4500,
}

declare namespace NodeJS {
	interface Global {
		log: any;
		lastMemoryTick: number;
		LastMemory: any;
		Memory: any;
		resourceStat: ( resourceType?:ResourceConstant, split:boolean) => void;
	}
}
