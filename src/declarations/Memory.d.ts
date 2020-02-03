interface Memory {

}

interface RoomMemory {
    avoid: number;
}

interface CreepMemory {
    _trav: TravelData;
    task: protoTask | null;
}

interface PowerCreepMemory {
    _trav: TravelData;
}