type StructureAtPos = {
    [structureType in StructureConstant]?: TypeToStructure[structureType];
};

interface RoomStructuresInterface {
    getAt(x: number, y: number): StructureAtPos;
    getAt(pos: Coord): StructureAtPos;

    getForAt<T extends StructureConstant>(type: T, x: number, y: number): TypeToStructure[T] | undefined;
    getForAt<T extends StructureConstant>(type: T, pos: Coord): TypeToStructure[T] | undefined;

    setStructure(structure: AnyStructure, x: number, y: number): void;
    setStructure(structure: AnyStructure, pos: Coord): void;
}