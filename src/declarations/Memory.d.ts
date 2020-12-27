interface Memory {
    MemVer: number;
    beebot: {
        outposts: {
            [roomName: string]: string[];
        },
        colonies: {
            [roomName: string]: {
                stage: ColonyStage,
            }
        }
    }
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

type BeeFillerMemory = CreepMemory & {
    i: number;
}

type BeeCarrierMemory = CreepMemory & {
    i: number,
    pos: RoomPosition,
    type: ResourceConstant,
}

type BeeMinerMemory = CreepMemory & {
    s: number;
}

type BeeScoutMemory = CreepMemory & {
    t?: string;
}

interface PowerCreepMemory {
    _trav: TravelData;
}