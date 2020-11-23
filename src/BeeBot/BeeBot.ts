import { BaseConstructor } from "basePlanner/BaseConstructor";
import { RoomPlanner } from "basePlanner/RoomPlanner";
import { event } from "event/Event";
import { profile } from "profiler/decorator";
import { getAllColonyRooms } from "utilities/utils";

@profile
export class BeeBot {
    public static getObservers(): StructureObserver[] {
        return [];
    }

    public static colonies(): Room[] {
        return getAllColonyRooms();
    }

    public static OnGlobalReseted() {
        this.colonies().forEach(room => BaseConstructor.get(room.name)
            && event.addEventListener('onRclUpgrade', () => RoomPlanner.replanRoads(room.name)));
    }
}