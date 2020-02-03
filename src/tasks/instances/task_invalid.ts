// Invalid task assigned if instantiation fails.

import {Task} from '../Task';

export class TaskInvalid extends Task {

	public static taskName = 'invalid';
	public target: any;

	constructor(target: any, options = {} as TaskOptions) {
		super('INVALID', target, options);
	}

	public isValidTask() {
		return false;
	}

	public isValidTarget() {
		return false;
	}

	public work() {
		return OK;
	}
}
