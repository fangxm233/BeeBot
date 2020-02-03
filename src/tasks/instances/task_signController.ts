import {Task} from '../Task';

export type signControllerTargetType = StructureController;

export class TaskSignController extends Task {

	public static taskName = 'signController';
	public target: signControllerTargetType;
	public data: {
		signature: string;
	};

	constructor(target: signControllerTargetType, signature = 'Your signature here',
				options                                     = {} as TaskOptions) {
		super(TaskSignController.taskName, target, options);
		this.data.signature = signature;
	}

	public isValidTask() {
		return true;
	}

	public isValidTarget() {
		const controller = this.target;
		return (!controller.sign || controller.sign.text != this.data.signature);
	}

	public work() {
		return this.creep.signController(this.target, this.data.signature);
	}
}
