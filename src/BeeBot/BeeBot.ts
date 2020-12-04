import { BaseConstructor } from "basePlanner/BaseConstructor";
import { RoomPlanner } from "basePlanner/RoomPlanner";
import { PriorityManager } from "beeSpawning/PriorityManager";
import { Intel } from "dataManagement/Intel";
import { PROCESS_CARRY, PROCESS_MINE_SOURCE, PROCESS_RESERVING } from "declarations/constantsExport";
import { event } from "event/Event";
import { ProcessCarry } from "process/instances/carry";
import { ProcessMineSource } from "process/instances/mineSource";
import { ProcessReserving } from "process/instances/reserving";
import { Process } from "process/Process";
import { profile } from "profiler/decorator";
import { Cartographer, ROOMTYPE_CONTROLLER } from "utilities/Cartographer";
import { hasAgressiveParts } from "utilities/helpers";
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
            event.addEventListener('onBuildComplete', () => BaseConstructor.refreshRoomStructures(room.name));
        });
    }

    public static goOutpost(from: string, to: string) {
        if (!Memory.beebot.outposts[from]) Memory.beebot.outposts[from] = [];
        if (_.contains(Memory.beebot.outposts[from], to)) return;
        Memory.beebot.outposts[from].push(to);
        Process.startProcess(new ProcessMineSource(from, to));
        Process.startProcess(new ProcessReserving(from, to));
        Process.startProcess(new ProcessCarry(from, to));
        const result = RoomPlanner.planRoom(from, to, true);
        if (result.result) BaseConstructor.get(from).constructBuildings();
    }

    public static cancelOutpost(from: string, to: string) {
        console.log(from, to);
        if (!Memory.beebot.outposts[from]) return;
        if (!_.contains(Memory.beebot.outposts[from], to)) return;
        _.pull(Memory.beebot.outposts[from], to);
        Process.getProcess<ProcessMineSource>(from, PROCESS_MINE_SOURCE, 'target', to)?.close();
        Process.getProcess<ProcessReserving>(from, PROCESS_RESERVING, 'target', to)?.close();
        Process.getProcess<ProcessCarry>(from, PROCESS_CARRY, 'target', to)?.close();
        RoomPlanner.removeRoomData(to);
    }

    public static getOutposts(roomName: string) {
        return Memory.beebot.outposts[roomName] || [];
    }

    public static getEarlyOutposts(roomName: string) {
        return Cartographer.findRoomsInRange(roomName, EARLY_OUTPOST_DEPTH)
            .filter(outPost => Cartographer.roomType(outPost) == ROOMTYPE_CONTROLLER && outPost != roomName);
    }

    private static startEarlyOutposts(roomName: string) {
        this.getEarlyOutposts(roomName).forEach(outpost => {
            const process = new ProcessMineSource(roomName, outpost, true);
            Process.startProcess(process);
        })
    }

    private static onRclUpgrade(roomName: string) {
        const intel = Intel.getRoomIntel(roomName);
        if (!intel || intel.rcl != 4) return;
        this.onRcl4(roomName);
    }

    public static cancelEarlyOutposts(roomName: string) {
        const outposts = Cartographer.findRoomsInRange(roomName, EARLY_OUTPOST_DEPTH)
            .filter(outPost => Cartographer.roomType(outPost) == ROOMTYPE_CONTROLLER && outPost != roomName);
        outposts.forEach(room =>
            Process.getProcess<ProcessMineSource>(roomName, PROCESS_MINE_SOURCE, 'target', room)?.close());
    }

    private static onRcl4(roomName: string) {
        this.cancelEarlyOutposts(roomName);
        Process.startProcess(new ProcessCarry(roomName, roomName));
    }

    public static run() {
        this.colonies().forEach(room => this.checkForSafeMode(room));
    }

    private colonize(from: string, to: string) {

    }

    private static checkForSafeMode(room: Room) {
        const data = RoomPlanner.getRoomData(room.name);
        if (!data) return;
        if (room.find(FIND_HOSTILE_CREEPS).filter(creep => hasAgressiveParts(creep)).find(creep =>
            creep.pos.inRangeTo(data.basePos!.x, data.basePos!.y, 5) || creep.pos.inRangeTo(room.controller!, 2)))
            room.controller!.activateSafeMode();
    }
}

(global as any).BeeBot = BeeBot;