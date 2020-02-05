import { ITask } from 'tasks';
import {attackTargetType, TaskAttack} from './instances/task_attack';
import {buildTargetType, TaskBuild} from './instances/task_build';
import {claimTargetType, TaskClaim} from './instances/task_claim';
import {dismantleTargetType, TaskDismantle} from './instances/task_dismantle';
import {dropTargetType, TaskDrop} from './instances/task_drop';
import {fortifyTargetType, TaskFortify} from './instances/task_fortify';
import {getBoostedTargetType, TaskGetBoosted} from './instances/task_getBoosted';
import {getRenewedTargetType, TaskGetRenewed} from './instances/task_getRenewed';
import {goToTargetType, TaskGoTo} from './instances/task_goTo';
import {goToRoomTargetType, TaskGoToRoom} from './instances/task_goToRoom';
import {harvestTargetType, TaskHarvest} from './instances/task_harvest';
import {healTargetType, TaskHeal} from './instances/task_heal';
import {meleeAttackTargetType, TaskMeleeAttack} from './instances/task_meleeAttack';
import {pickupTargetType, TaskPickup} from './instances/task_pickup';
import {rangedAttackTargetType, TaskRangedAttack} from './instances/task_rangedAttack';
import {repairTargetType, TaskRepair} from './instances/task_repair';
import {reserveTargetType, TaskReserve} from './instances/task_reserve';
import {signControllerTargetType, TaskSignController} from './instances/task_signController';
import {TaskTransfer, transferTargetType} from './instances/task_transfer';
import {TaskTransferAll, transferAllTargetType} from './instances/task_transferAll';
import {TaskUpgrade, upgradeTargetType} from './instances/task_upgrade';
import {TaskWithdraw, withdrawTargetType} from './instances/task_withdraw';
import {TaskWithdrawAll, withdrawAllTargetType} from './instances/task_withdrawAll';

export class Tasks {

	/* Tasks.chain allows you to transform a list of tasks into a single task, where each subsequent task in the list
	 * is the previous task's parent. SetNextPos will chain Task.nextPos as well, preventing creeps from idling for a
	 * tick between tasks. If an empty list is passed, null is returned. */
	public static chain(tasks: ITask[], setNextPos = true): ITask | null {
		if (tasks.length == 0) {
			return null;
		}
		if (setNextPos) {
			for (let i = 0; i < tasks.length - 1; i++) {
				tasks[i].options.nextPos = tasks[i + 1].targetPos;
			}
		}
		// Make the accumulator task from the end and iteratively fork it
		let task = _.last(tasks); // start with last task
		tasks = _.dropRight(tasks); // remove it from the list
		for (let i = (tasks.length - 1); i >= 0; i--) { // iterate over the remaining tasks
			task = task.fork(tasks[i]);
		}
		return task;
	}

	public static attack(target: attackTargetType, options = {} as TaskOptions): TaskAttack {
		return new TaskAttack(target, options);
	}

	public static build(target: buildTargetType, options = {} as TaskOptions): TaskBuild {
		return new TaskBuild(target, options);
	}

	public static claim(target: claimTargetType, options = {} as TaskOptions): TaskClaim {
		return new TaskClaim(target, options);
	}

	public static dismantle(target: dismantleTargetType, options = {} as TaskOptions): TaskDismantle {
		return new TaskDismantle(target, options);
	}

	public static drop(target: dropTargetType,
				resourceType: ResourceConstant = RESOURCE_ENERGY,
				amount: number | undefined,
				options                        = {} as TaskOptions): TaskDrop {
		return new TaskDrop(target, resourceType, amount, options);
	}

	public static fortify(target: fortifyTargetType, options = {} as TaskOptions): TaskFortify {
		return new TaskFortify(target, options);
	}

	public static getBoosted(target: getBoostedTargetType,
					  boostType: _ResourceConstantSansEnergy,
					  amount: number | undefined,
					  options                    = {} as TaskOptions): TaskGetBoosted {
		return new TaskGetBoosted(target, boostType, amount, options);
	}

	public static getRenewed(target: getRenewedTargetType, options = {} as TaskOptions): TaskGetRenewed {
		return new TaskGetRenewed(target, options);
	}

	public static goTo(target: goToTargetType, options = {} as TaskOptions): TaskGoTo {
		return new TaskGoTo(target, options);
	}

	public static goToRoom(target: goToRoomTargetType, options = {} as TaskOptions): TaskGoToRoom {
		return new TaskGoToRoom(target, options);
	}

	public static harvest(target: harvestTargetType, options = {} as TaskOptions): TaskHarvest {
		return new TaskHarvest(target, options);
	}

	public static heal(target: healTargetType, options = {} as TaskOptions): TaskHeal {
		return new TaskHeal(target, options);
	}

	public static meleeAttack(target: meleeAttackTargetType, options = {} as TaskOptions): TaskMeleeAttack {
		return new TaskMeleeAttack(target, options);
	}

	public static pickup(target: pickupTargetType, options = {} as TaskOptions): TaskPickup {
		return new TaskPickup(target, options);
	}

	public static rangedAttack(target: rangedAttackTargetType, options = {} as TaskOptions): TaskRangedAttack {
		return new TaskRangedAttack(target, options);
	}

	public static repair(target: repairTargetType, options = {} as TaskOptions): TaskRepair {
		return new TaskRepair(target, options);
	}

	public static reserve(target: reserveTargetType, options = {} as TaskOptions): TaskReserve {
		return new TaskReserve(target, options);
	}

	public static signController(target: signControllerTargetType, signature: string,
						  options = {} as TaskOptions): TaskSignController {
		return new TaskSignController(target, signature, options);
	}

	public static transfer(target: transferTargetType,
					resourceType: ResourceConstant = RESOURCE_ENERGY,
					amount: number | undefined,
					options                        = {} as TaskOptions): TaskTransfer {
		return new TaskTransfer(target, resourceType, amount, options);
	}

	public static transferAll(target: transferAllTargetType,
					   skipEnergy = false,
					   options    = {} as TaskOptions): TaskTransferAll {
		return new TaskTransferAll(target, skipEnergy, options);
	}

	public static upgrade(target: upgradeTargetType, options = {} as TaskOptions): TaskUpgrade {
		return new TaskUpgrade(target, options);
	}

	public static withdraw(target: withdrawTargetType,
					resourceType: ResourceConstant = RESOURCE_ENERGY,
					amount: number | undefined,
					options                        = {} as TaskOptions): TaskWithdraw {
		return new TaskWithdraw(target, resourceType, amount, options);
	}

	public static withdrawAll(target: withdrawAllTargetType, options = {} as TaskOptions): TaskWithdrawAll {
		return new TaskWithdrawAll(target, options);
	}

}
