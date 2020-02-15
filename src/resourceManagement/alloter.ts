import { getFreeKey, minBy } from "utilities/utils";
import { profile } from "../profiler/decorator";

export const ALLOT_FILLER = 0;
export const ALLOT_HARVEST = 1;
export const ALLOT_TRANSPORT = 2;
export const ALLOT_RESERVE = 3;

type AllotType = 0 | 1 | 2 | 3;

@profile
export class Alloter {
    public static AddType(type: AllotType, roomName: string): void {
        if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {} as any;
        if (!Memory.rooms[roomName].allot) Memory.rooms[roomName].allot = {};
        Memory.rooms[roomName].allot[type] = [];
    }

    public static removeType(type: AllotType, roomName: string): void {
        if (!Memory.rooms[roomName]) return;
        if (!Memory.rooms[roomName].allot) return;
        delete Memory.rooms[roomName].allot[type];
    }

    public static addUnit(unit: protoAllotUnit, type: AllotType): string {
        const roomName = unit.roomName;
        if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {} as any;
        if (!Memory.rooms[roomName].allot) Memory.rooms[roomName].allot = {};
        if (!Memory.rooms[roomName].allot[type]) Memory.rooms[roomName].allot[type] = [];
        const units = Memory.rooms[roomName].allot[type];
        const free = getFreeKey(units);
        units[free] = unit;
        unit.id = free;
        unit.available = false;
        unit.typeId = type;
        return this.getFullId(unit);
    }

    public static removeUnit(unitId: string): void {
        const unit = this.getUnit(unitId);
        if(!unit) return;
        if (!_.has(Memory.rooms, [unit.roomName, 'allot', unit.typeId])) return;
        delete Memory.rooms[unit.roomName].allot[unit.typeId][unit.id];
    }

    public static getUnitWithKeyValue(type: AllotType, roomName: string, key: string, value: any): protoAllotUnit | undefined {
        if (!_.has(Memory.rooms, [roomName, 'allot', type])) return;
        return Memory.rooms[roomName].allot[type].find(unit => unit && unit.data[key] === value);
    }

    public static allot(type: AllotType, roomName: string): string | undefined {
        if (!_.has(Memory.rooms, [roomName, 'allot', type])) return;
        const units = Memory.rooms[roomName].allot[type];
        const unit = units.find(unit => unit && unit.available);
        if(!unit) return;
        unit.available = false;
        return this.getFullId(unit);
    }

    public static allotSmallestByRange(type: AllotType, roomName: string, pos: RoomPosition): string | undefined {
        if (!_.has(Memory.rooms, [roomName, 'allot', type])) return;
        const units = Memory.rooms[roomName].allot[type];
        const unit = minBy(units, unit => {
            if (!unit) return false;
            if (!unit.data.pos) return false;
            return pos.getMultiRoomRangeTo(new RoomPosition(unit.data.pos.x, unit.data.pos.y, unit.data.pos.roomName));
        });
        if(!unit) return;
        unit.available = false;
        return this.getFullId(unit);
    }

    public static allotSmallestByKey(type: AllotType, roomName: string, key: string): string | undefined {
        if (!_.has(Memory.rooms, [roomName, 'allot', type])) return;
        const units = Memory.rooms[roomName].allot[type];
        const unit = minBy(units, unit => {
            if (!unit) return false;
            if (!unit.data[key] && unit.data[key] !== 0) return false;
            return unit.data[key];
        });
        if(!unit) return;
        unit.available = false;
        return this.getFullId(unit);
    }

    public static free(unitId: string) {
        const unit = this.getUnit(unitId);
        if (!unit) return;
        if (!_.has(Memory.rooms, [unit.roomName, 'allot', unit.typeId, unit.id])) return;
        Memory.rooms[unit.roomName].allot[unit.typeId][unit.id].available = true;
    }

    public static getUnitCount(type: AllotType, roomName: string): number {
        if (!_.has(Memory.rooms, [roomName, 'allot', type])) return -1;
        let count = 0;
        _.forEach(Memory.rooms[roomName].allot[type], element => { if (element) count++; })
        return count;
    }

    public static exist(type: AllotType, roomName: string, key: string, value: any): boolean {
        if (!_.has(Memory.rooms, [roomName, 'allot', type])) return false;
        return _.some(Memory.rooms[roomName].allot[type], unit => unit && unit.data[key] === value);
    }

    public static getFullId(unit: protoAllotUnit): string {
        if (!unit) return '';
        return `${unit.roomName}:${unit.typeId}:${unit.id}`;
    }

    public static getUnit(fullId: string): protoAllotUnit | undefined {
        const values = fullId.split(':');
        if(values.length != 3) return;
        const roomName = values[0];
        const typeId = Number.parseInt(values[1], 10);
        const id = Number.parseInt(values[2], 10);
        return _.get(Memory.rooms, [roomName, typeId, id]);
    }
}