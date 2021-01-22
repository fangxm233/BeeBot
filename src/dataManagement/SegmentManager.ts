import { profile } from "profiler/decorator";

export const STATS_SEGMENT = 0;
export const ROOM_DATA_SEGMENT = 1;
export const BEE_CONFIG_SEGMENT = 2;
export const INTEL_SEGMENT = 4;

@profile
export class SegmentManager {
    private static segmentsCache: { [id: number]: string } = {};

    public static applySegments() {
        RawMemory.setActiveSegments([STATS_SEGMENT, ROOM_DATA_SEGMENT, BEE_CONFIG_SEGMENT, INTEL_SEGMENT]);
    }

    public static getSegment(id: number): string | undefined {
        if (this.segmentsCache[id] != undefined) return this.segmentsCache[id];
        return this.segmentsCache[id] = RawMemory.segments[id];
    }

    public static writeSegment(id: number, data: string) {
        RawMemory.segments[id] = data;
        this.segmentsCache[id] = data;
    }

    public static clearSegments() {
        for (let i = 0; i < 100; i++) {
            RawMemory.segments[i] = '';
        }
    }
}