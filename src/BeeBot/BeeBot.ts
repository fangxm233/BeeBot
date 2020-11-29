import { BaseConstructor } from "basePlanner/BaseConstructor";
import { RoomPlanner } from "basePlanner/RoomPlanner";
import { PriorityManager } from "beeSpawning/PriorityManager";
import { event } from "event/Event";
import { profile } from "profiler/decorator";
import { Cartographer, ROOMTYPE_CONTROLLER } from "utilities/Cartographer";
import { getAllColonyRooms } from "utilities/utils";

const EARLY_OUTPOST_DEPTH = 1;

@profile
export class BeeBot {
    public static getObservers(): StructureObserver[] {
        return [];
    }

    public static colonies(): Room[] {
        return getAllColonyRooms();
    }

    public static OnGlobalReseted() {
        this.colonies().forEach(room => {
            BaseConstructor.get(room.name);
            PriorityManager.arrangePriority(room.name);
        });
    }

    public static getEarlyOutposts(roomName: string) {
        return Cartographer.findRoomsInRange(roomName, EARLY_OUTPOST_DEPTH)
            .filter(roomName => Cartographer.roomType(roomName) == ROOMTYPE_CONTROLLER);
    }
}