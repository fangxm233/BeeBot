import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { Bee } from 'Bee/Bee';
import { BeeBot } from 'BeeBot/BeeBot';
import { profile } from 'profiler/decorator';
import { withdrawTargetType } from 'tasks/instances/task_withdraw';
import { Task } from 'tasks/Task';
import { Tasks } from 'tasks/Tasks';

@profile
export class ResourcesManager {

    public static getEnergySource(bee: Bee, isFiller: boolean, minAmount?: number): Task | null {
        const early = BeeBot.getColonyStage(bee.room.name) == 'early';
        const remain = minAmount === undefined ? bee.store.getFreeCapacity() * 0.5 : minAmount;

        let candidates: (withdrawTargetType | Resource)[] =
            bee.room.tombstones.filter(tomb => tomb.store.energy >= remain);
        candidates.push(...bee.room.droppedEnergy.filter(energy => energy.amount > remain));
        candidates.push(...bee.room.ruins.filter(ruin => ruin.store.energy >= remain));
        if (early) {
            BeeBot.getEarlyOutposts(bee.process.roomName).forEach(roomName => {
                const room = Game.rooms[roomName];
                if (!room) return;
                candidates.push(...room.droppedEnergy.filter(energy => energy.amount > remain));
            });
        }

        if (bee.room.storage) {
            if (bee.room.storage.energy >= remain) candidates.push(bee.room.storage);
        }
        if (bee.room.terminal) {
            if (bee.room.terminal.energy >= remain) candidates.push(bee.room.terminal);
        }

        candidates.push(...bee.room.containers.filter(
            container => container.store.energy >= remain
                && (isFiller || !RoomPlanner.isFillerContainer(container.pos))));
        candidates.push(...bee.room.links.filter(link => link.store.energy >= remain));

        const spawnRoom = Game.rooms[bee.process.roomName];
        if (spawnRoom?.storage && spawnRoom.storage.store.energy >= remain) {
            candidates.push(spawnRoom.storage);
        }

        candidates = candidates.filter(structure => {
            function getOrdered(target: withdrawTargetType | Resource) {
                return _.sum(target.targetedBy, creep => creep.store.getFreeCapacity());
            }

            if (structure instanceof Resource) return structure.amount > getOrdered(structure);
            return structure.store.energy >= getOrdered(structure);
        });

        if (candidates.length) {
            const target = bee.pos.findClosestByMultiRoomRange(candidates);
            if (target instanceof Resource) {
                return Tasks.pickup(target);
            } else if (target) {
                return Tasks.withdraw(target, RESOURCE_ENERGY);
            }
        }
        return null;
    }
}