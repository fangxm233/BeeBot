// TaskAttackController: attacks controller if it is reserved by other user

import { USER_NAME } from 'config';
import { Task } from '../Task';

export type attackTargetType = Creep | Structure;

export class TaskAttackController extends Task {

    public static taskName = 'attackController';
    public target: StructureController;

    constructor(target: attackTargetType, options = {} as TaskOptions) {
        super(TaskAttackController.taskName, target, options);
        // Settings
        this.settings.targetRange = 1;
    }

    public isValidTask() {
        return (this.bee.getActiveBodyparts(CLAIM) > 0);
    }

    public isValidTarget(): boolean {
        return this.target && !!this.target.reservation && this.target.reservation.username != USER_NAME;
    }

    public work() {
        return this.bee.attackController(this.target);
    }
}
