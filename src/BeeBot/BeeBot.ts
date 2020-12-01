import { BaseConstructor } from "basePlanner/BaseConstructor";
import { RoomPlanner } from "basePlanner/RoomPlanner";
import { PriorityManager } from "beeSpawning/PriorityManager";
import { Intel } from "dataManagement/Intel";
import { event } from "event/Event";
import { ProcessCarry } from "process/instances/carry";
import { ProcessMineSource } from "process/instances/mineSource";
import { ProcessReserving } from "process/instances/reserving";
import { Process } from "process/Process";
import { PROCESS_MINE_SOURCE } from "process/Processes";
import { profile } from "profiler/decorator";
import { Cartographer, ROOMTYPE_CONTROLLER } from "utilities/Cartographer";
import { getAllColonyRooms } from "utilities/utils";

const EARLY_OUTPOST_DEPTH = 1;

@profile
export class BeeBot {
    public static getObservers(): StructureObserver[] {
        return _.compact(this.colonies().map(room => room.observer!));
    }

    public static colonies(): Room[] {
        return getAllColonyRooms();
    }

    public static OnGlobalReseted() {
        this.colonies().forEach(room => {
            BaseConstructor.get(room.name);
            PriorityManager.arrangePriority(room.name);
            event.addEventListener('onRclUpgrade', () => this.onRclUpgrade(room.name));
        });
    }

    public static goOutpost(from: string, to: string) {
        if (!Memory.beebot.outposts[from]) Memory.beebot.outposts[from] = [];
        if (_.find(Memory.beebot.outposts[from]), to) return;
        Memory.beebot.outposts[from].push(to);
        Process.startProcess(new ProcessMineSource(from, to));
        Process.startProcess(new ProcessReserving(from, to));
        Process.startProcess(new ProcessCarry(from, to));
        const result = RoomPlanner.planRoom(from, to, true);
        if (result.result) BaseConstructor.get(from).constructBuildings();
    }

    public static getOutposts(roomName: string) {
        return Memory.beebot.outposts[roomName] || [];
    }

    public static getEarlyOutposts(roomName: string) {
        const intel = Intel.getRoomIntel(roomName);
        if (!intel || intel.rcl! >= 4) return [];
        return Cartographer.findRoomsInRange(roomName, EARLY_OUTPOST_DEPTH)
            .filter(roomName => Cartographer.roomType(roomName) == ROOMTYPE_CONTROLLER);
    }

    private static onRclUpgrade(roomName: string) {
        const intel = Intel.getRoomIntel(roomName);
        if (!intel || intel.rcl != 4) return;
        this.onRcl4(roomName);
    }

    public static cancelEarlyOutposts(roomName: string) {
        const outposts = Cartographer.findRoomsInRange(roomName, EARLY_OUTPOST_DEPTH)
            .filter(roomName => Cartographer.roomType(roomName) == ROOMTYPE_CONTROLLER);
        outposts.forEach(room =>
            Process.getProcess<ProcessMineSource>(roomName, PROCESS_MINE_SOURCE, 'target', room)?.close());
    }

    private static onRcl4(roomName: string) {
        this.cancelEarlyOutposts(roomName);
    }
}