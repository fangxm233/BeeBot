import { Process } from "process/Process";
import { PROCESS_SCOUTING } from "process/Processes";
import { profile } from "profiler/decorator";

@profile
export class ProcessScouting extends Process {
    constructor(roomName: string) {
        super(roomName, PROCESS_SCOUTING);
    }
}