import { Bee } from "../Bee/Bee";

interface ITask extends protoTask {
	settings: TaskSettings;
	proto: protoTask;
	bee: Bee;
	target: RoomObject | null;
	targetPos: RoomPosition;
	parent: ITask | null;
	manifest: ITask[];
	targetManifest: (RoomObject | null)[];
	targetPosManifest: RoomPosition[];
	eta: number | undefined;

	fork(newTask: ITask): ITask;

	isValidTask(): boolean;

	isValidTarget(): boolean;

	isValid(): boolean;

	moveToTarget(range?: number): number;

	run(): number | void;

	work(): number;

	finish(): void;
}