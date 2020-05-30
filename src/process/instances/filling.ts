import { Process } from "process/Process";
import { profile } from "profiler/decorator";

@profile
export class ProcessFilling extends Process {
    constructor(roomName: string) {
        super(roomName, PROCESS_FILLING);
    }

    public static getInstance(proto: protoProcessFilling, roomName: string): ProcessFilling {
        return new ProcessFilling(roomName);
    }

    public check() {
        const room = Game.rooms[this.roomName];
        if (room) return room.energyAvailable < room.energyCapacityAvailable;
        else {
            this.close();
            return false;
        }
    }
}