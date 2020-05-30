interface Memory {
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
    _trav: TravelData;
    task: protoTask | null;

    allotedId: string;
}

interface PowerCreepMemory {
    _trav: TravelData;
}