// Reinstantiation of a task object from protoTask data

import {attackTargetType, TaskAttack} from '../instances/task_attack';
import {buildTargetType, TaskBuild} from '../instances/task_build';
import {claimTargetType, TaskClaim} from '../instances/task_claim';
import {dismantleTargetType, TaskDismantle} from '../instances/task_dismantle';
import {dropTargetType, TaskDrop} from '../instances/task_drop';
import {fortifyTargetType, TaskFortify} from '../instances/task_fortify';
import {getBoostedTargetType, TaskGetBoosted} from '../instances/task_getBoosted';
import {getRenewedTargetType, TaskGetRenewed} from '../instances/task_getRenewed';
import {goToTargetType, TaskGoTo} from '../instances/task_goTo';
import {goToRoomTargetType, TaskGoToRoom} from '../instances/task_goToRoom';
import {harvestTargetType, TaskHarvest} from '../instances/task_harvest';
import {healTargetType, TaskHeal} from '../instances/task_heal';
import {TaskInvalid} from '../instances/task_invalid';
import {meleeAttackTargetType, TaskMeleeAttack} from '../instances/task_meleeAttack';
import {pickupTargetType, TaskPickup} from '../instances/task_pickup';
import {rangedAttackTargetType, TaskRangedAttack} from '../instances/task_rangedAttack';
import {repairTargetType, TaskRepair} from '../instances/task_repair';
import {reserveTargetType, TaskReserve} from '../instances/task_reserve';
import {signControllerTargetType, TaskSignController} from '../instances/task_signController';
import {TaskTransfer, transferTargetType} from '../instances/task_transfer';
import {TaskTransferAll, transferAllTargetType} from '../instances/task_transferAll';
import {TaskUpgrade, upgradeTargetType} from '../instances/task_upgrade';
import {TaskWithdraw, withdrawTargetType} from '../instances/task_withdraw';
import {TaskWithdrawAll, withdrawAllTargetType} from '../instances/task_withdrawAll';
import {Task} from '../Task';
import {deref, derefRoomPosition} from './helpers';


export function initializeTask(protoTask: protoTask): Task {
	// Retrieve name and target data from the protoTask
	const taskName = protoTask.name;
	const target = deref(protoTask._target.ref);
	let task: Task;
	// Create a task object of the correct type
	switch (taskName) {
		case TaskAttack.taskName:
			task = new TaskAttack(target as attackTargetType);
			break;
		case TaskBuild.taskName:
			task = new TaskBuild(target as buildTargetType);
			break;
		case TaskClaim.taskName:
			task = new TaskClaim(target as claimTargetType);
			break;
		case TaskDismantle.taskName:
			task = new TaskDismantle(target as dismantleTargetType);
			break;
		case TaskDrop.taskName:
			task = new TaskDrop(derefRoomPosition(protoTask._target._pos) as dropTargetType);
			break;
		case TaskFortify.taskName:
			task = new TaskFortify(target as fortifyTargetType);
			break;
		case TaskGetBoosted.taskName:
			task = new TaskGetBoosted(target as getBoostedTargetType,
									  protoTask.data.resourceType as _ResourceConstantSansEnergy);
			break;
		case TaskGetRenewed.taskName:
			task = new TaskGetRenewed(target as getRenewedTargetType);
			break;
		case TaskGoTo.taskName:
			task = new TaskGoTo(derefRoomPosition(protoTask._target._pos) as goToTargetType);
			break;
		case TaskGoToRoom.taskName:
			task = new TaskGoToRoom(protoTask._target._pos.roomName as goToRoomTargetType);
			break;
		case TaskHarvest.taskName:
			task = new TaskHarvest(target as harvestTargetType);
			break;
		case TaskHeal.taskName:
			task = new TaskHeal(target as healTargetType);
			break;
		case TaskMeleeAttack.taskName:
			task = new TaskMeleeAttack(target as meleeAttackTargetType);
			break;
		case TaskPickup.taskName:
			task = new TaskPickup(target as pickupTargetType);
			break;
		case TaskRangedAttack.taskName:
			task = new TaskRangedAttack(target as rangedAttackTargetType);
			break;
		case TaskRepair.taskName:
			task = new TaskRepair(target as repairTargetType);
			break;
		case TaskReserve.taskName:
			task = new TaskReserve(target as reserveTargetType);
			break;
		case TaskSignController.taskName:
			task = new TaskSignController(target as signControllerTargetType);
			break;
		case TaskTransfer.taskName:
			task = new TaskTransfer(target as transferTargetType);
			break;
		case TaskTransferAll.taskName:
			task = new TaskTransferAll(target as transferAllTargetType);
			break;
		case TaskUpgrade.taskName:
			task = new TaskUpgrade(target as upgradeTargetType);
			break;
		case TaskWithdraw.taskName:
			task = new TaskWithdraw(target as withdrawTargetType);
			break;
		case TaskWithdrawAll.taskName:
			task = new TaskWithdrawAll(target as withdrawAllTargetType);
			break;
		default:
			console.log(`Invalid task name: ${taskName}! task.creep: ${protoTask._creep.name}. Deleting from memory!`);
			task = new TaskInvalid(target as any);
			break;
	}
	// Set the task proto to what is in memory
	task.proto = protoTask;
	// Return it
	return task;
}

