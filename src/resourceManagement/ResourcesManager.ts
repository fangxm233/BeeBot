import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";
import { Task } from "tasks/Task";
import { Tasks } from "tasks/Tasks";

@profile
export class ResourcesManager {

    public static getEnergySource(bee: Bee, minAmount?: number): Task | null {
        const remain = Math.max(bee.store.getFreeCapacity() * 0.5, minAmount || 0);
        const candidates: (Tombstone | StructureStorage | StructureContainer | StructureLink | StructureTerminal | Resource | Ruin)[] = bee.room.tombstones.filter(tomb => tomb.store.energy >= remain);
        candidates.push(...bee.room.droppedEnergy.filter(energy => energy.amount > remain));
        candidates.push(...bee.room.ruins.filter(ruin => ruin.store.energy >= remain));

        if (bee.room.storage) {
            if (bee.room.storage.energy >= remain) candidates.push(bee.room.storage);
        }
        if (bee.room.terminal) {
            if (bee.room.terminal.energy >= remain) candidates.push(bee.room.terminal);
        }

        candidates.push(...bee.room.containers.filter(container => container.store.energy >= remain));
        candidates.push(...bee.room.links.filter(link => link.store.energy >= remain));

        const spawnRoom = Game.rooms[bee.process.roomName];
        if (spawnRoom?.storage && spawnRoom.storage.store.energy >= remain) {
            candidates.push(spawnRoom.storage);
        }

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