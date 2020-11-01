interface Memory {
    MemVer: number;
    processes: {
        [processName: string]: {
            [roomName: string]: protoProcess[];
        };
    }
}

interface RoomMemory {
    avoid: number;

    allot: { [type: number]: protoAllotUnit[]; };
}

interface CreepMemory {
    _path: string;
    task: protoTask | null;

    /**
     * arriveTick
     */
    AT?: number;
}

type CreepMinerMemory = CreepMemory & {
    s: number;
}

interface PowerCreepMemory {
    _trav: TravelData;
}