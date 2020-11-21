import { profile } from "profiler/decorator";

@profile
export class BeeBot {
    public static getObservers(): StructureObserver[] {
        return [];
    }

    public static myRooms(): Room[] {
        return [];
    }
}