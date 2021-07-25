import { PowerBee } from 'Bee/PowerBee';
import { ProcessCarry } from 'process/instances/carry';
import { profile } from 'profiler/decorator';

@profile
export class PowerBeeBaseBooster extends PowerBee {
    public process: ProcessCarry;

    public get memory(): PowerBeePeaceMemory {
        return this.creep.memory as PowerBeePeaceMemory;
    }

    public runCore() {
        if (!this.room) {
            const room = Game.rooms[this.name.split('Operator')[0]];
            const powerSpawn = room.powerSpawn;
            if (powerSpawn && !this.spawnCooldownTime)
                this.spawn(powerSpawn);
        }
        if (!this.room) return;

        if (this.keepAlive()) return;

        if (this.enablePower()) return;

        this.task?.isValid();
        if (!this.task) {
            return;
        }

        this.task?.run();
    }

    public keepAlive(): boolean {
        const powerSpawn = this.room!.powerSpawn;
        if (powerSpawn && this.ticksToLive <= 4900) {
            if (!this.pos.isNearTo(powerSpawn)) {
                this.travelTo(powerSpawn);
                return true;
            }
            this.renewCreep(powerSpawn);
            return true;
        }
        return false;
    }

    private enablePower(): boolean {
        const controller = this.room?.controller;
        if (!controller) return false;
        if (!controller.isPowerEnabled) {
            if (!this.pos.inRangeTo(controller, 3)) {
                this.travelTo(controller);
                return true;
            }
            this.enableRoom(controller);
            return true;
        }
        return false;
    }
}