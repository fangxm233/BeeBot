import {Task} from '../Task';

export type getRenewedTargetType = StructureSpawn;

export class TaskGetRenewed extends Task {
	public static taskName = 'getRenewed';
	public target: getRenewedTargetType;

	constructor(target: getRenewedTargetType, options = {} as TaskOptions) {
		super(TaskGetRenewed.taskName, target, options);
	}

	public isValidTask() {
		const hasClaimPart = _.filter(this.creep.body, (part: BodyPartDefinition) => part.type == CLAIM).length > 0;
		const lifetime = hasClaimPart ? CREEP_CLAIM_LIFE_TIME : CREEP_LIFE_TIME;
		return this.creep.ticksToLive != undefined && this.creep.ticksToLive < 0.9 * lifetime;
	}

	public isValidTarget() {
		return this.target.my;
	}

	public work() {
		return this.target.renewCreep(this.creep);
	}
}
