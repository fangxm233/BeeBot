import { profile } from "profiler/decorator";

@profile
export class RoomStructures implements RoomStructuresInterface {
    private structures: { time: number, structure: StructureAtPos }[];
    public time: number;

    constructor() {
        this.time = Game.time;
        this.structures = [];
    }

    public getAt(x: number, y: number): StructureAtPos;
    public getAt(pos: Coord): StructureAtPos;

    public getAt(x: number | { x: number; y: number; }, y?: number): StructureAtPos {
        if (typeof x != 'number') {
            y = x.y;
            x = x.x;
        }
        if (y == undefined) return {};
        if (x < 1 || x > 48 || y < 1 || y > 48) return {};
        x--; y--;

        const index = y * 47 + x;
        return this.refresh(this.structures[index]?.structure || {});
    }

    public getForAt<T extends StructureConstant>(type: T, x: number, y: number): TypeToStructure[T] | undefined;
    public getForAt<T extends StructureConstant>(type: T, pos: Coord): TypeToStructure[T] | undefined;

    public getForAt<T extends StructureConstant>(type: T, x: number | Coord, y?: number): TypeToStructure[T] | undefined {
        if (typeof x != 'number') {
            y = x.y;
            x = x.x;
        }
        if (y == undefined) return;
        return this.getAt(x, y)[type] as any;
    }

    public setStructure(structure: AnyStructure, x: number, y: number): void;
    public setStructure(structure: AnyStructure, pos: Coord): void;

    public setStructure(structure: AnyStructure, x: number | Coord, y?: number): void {
        if (typeof x != 'number') {
            y = x.y;
            x = x.x;
        }
        if (y == undefined) return;
        if (x < 1 || x > 48 || y < 1 || y > 48) return;
        x--; y--;

        const index = y * 47 + x;
        if (!this.structures[index]) this.structures[index] = { time: Game.time, structure: {} };
        this.structures[index].structure[structure.structureType] = structure as any;
    }

    private refresh(structureInPos: StructureAtPos): StructureAtPos {
        for (const key in structureInPos) {
            const element = structureInPos[key];
            if (!element) continue;
            structureInPos[key] = Game.getObjectById(element.id);
        }
        return structureInPos;
    }
}