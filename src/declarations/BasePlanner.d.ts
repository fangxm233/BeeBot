interface RoomData {
    ownedRoom: boolean;
    basePos?: Coord;
    sourcesPath: Path[];
    controllerPath?: Path;
    mineralPath?: Path;
    containerPos?: { controller: Coord };
    harvestPos: { source: Coord[], mineral?: Coord };
    linkPos?: { source: Coord[], controller: Coord };
}

interface Path {
    path: RoomPosition[];
    length: number;
}

interface PlanRoomResult {
    failed?: boolean;
    intelMissing?: boolean;
    matrixMissing?: boolean;
    result?: RoomData;
}

interface GenerateRoomPathResult {
    failed?: boolean;
    intelMissing?: boolean;
    matrixMissing?: boolean;
    paths?: {
        sources: RoomPosition[][],
        mineral?: RoomPosition[],
        controller?: RoomPosition[]
    };
}

interface GeneratePathResult {
    incomplete?: boolean;
    matrixMissing?: boolean;
    path?: RoomPosition[];
}