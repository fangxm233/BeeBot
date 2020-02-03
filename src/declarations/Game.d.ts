interface Game {
	TargetCache: {
		tick: number;
		targets: { [ref: string]: string[] };
		build(): void;
	}
}