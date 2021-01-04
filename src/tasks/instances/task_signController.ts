import {Task} from '../Task';

export type signControllerTargetType = StructureController;

export class TaskSignController extends Task {

	public static taskName = 'signController';
	public data: {
		signature: string;
	};

	constructor(target: signControllerTargetType, signature = 'Your signature here',
				options                                     = {} as TaskOptions) {
		super(TaskSignController.taskName, target, options);
		this.data.signature = signature;
	}

	public get target() {
		return super.target as signControllerTargetType;
	}

	public isValidTask() {
		return true;
	}

	public isValidTarget() {
		const controller = this.target;
		return (!controller.sign || controller.sign.text != this.data.signature);
	}

	public work() {
		return this.bee.signController(this.target, this.data.signature);
	}
}
