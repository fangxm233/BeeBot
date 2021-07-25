import { PowerBee } from 'powerBee/powerBee'
import { ProcessCarry } from 'process/instances/carry';
import { profile } from 'profiler/decorator';
import { Tasks } from 'tasks/Tasks';

@profile
export class PowerBeePeace extends PowerBee {
    public process: ProcessCarry;

    public get memory(): PowerBeePeaceMemory {
        return this.creep.memory as PowerBeePeaceMemory;
    }

    public runCore() {
        if(!this.room)
        {
            const room = Game.rooms[this.name.split("Operator")[0]]
            const powerSpawn = room.powerSpawn
            if(powerSpawn && !this.spawnCooldownTime)
                this.spawn(powerSpawn)
        }
        if(this.ticksToLive<=500)
        {
            this.keepAlive();
            return;
        }
        if(!this.room?.controller?.isPowerEnabled){
            this.enablePower();
            return;
        }
        this.task?.isValid();
        if (!this.task) {
            return;
        }

        this.task?.run();
    }

    public keepAlive(){
        const powerSpawn = this.room?.powerSpawn
        if(powerSpawn && this.renewCreep(powerSpawn)==ERR_NOT_IN_RANGE)
        {
            this.travelTo(powerSpawn)
        }
    }

    private enablePower(){
        if(this.room?.controller && this.enableRoom(this.room.controller)==ERR_NOT_IN_RANGE)
            this.travelTo(this.room?.controller)
    }
}