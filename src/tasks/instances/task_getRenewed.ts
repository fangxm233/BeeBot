import {Task} from '../Task';

export type getRenewedTargetType = StructureSpawn;

export class TaskGetRenewed extends Task {
	public static taskName = 'getRenewed';

	constructor(target: getRenewedTargetType, options = {} as TaskOptions) {
		super(TaskGetRenewed.taskName, target, options);
	}

	public get target() {
		return super.target as getRenewedTargetType;
	}

	public isValidTask() {
		const hasClaimPart = _.filter(this.bee.body, (part: BodyPartDefinition) => part.type == CLAIM).length > 0;
		const lifetime = hasClaimPart ? CREEP_CLAIM_LIFE_TIME : CREEP_LIFE_TIME;
		return this.bee.ticksToLive != undefined && this.bee.ticksToLive < 0.9 * lifetime;
	}

	public isValidTarget() {
		return this.target.my;
	}

	public work() {
		return this.target.renewCreep(this.bee.creep);
	}
}
