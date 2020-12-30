import { log } from 'console/log';
import { profile } from 'profiler/decorator';

@profile
export class TerminalManager {

    public static getTransport(roomName: string) {
        if (!Memory.transport[roomName]) return;
        return Memory.transport[roomName];
    }

    public static setTransport(from: string, to: string, type: ResourceConstant, amount: number) {
        if (Memory.transport[from]) return;
        log.debug(`Transport: from: ${from} to: ${to}, type: ${type} amount: ${amount}`);
        Memory.transport[from] = { des: to, type, amount };
    }

    public static clearTransport(roomName: string) {
        Memory.transport[roomName] = undefined!;
    }

    public static hasIncomingTransport(roomName: string): boolean {
        return !!_.find(Memory.transport, transport => transport?.des == roomName);
    }

    public static hasOutgoingTransport(roomName: string): boolean {
        return !!Memory.transport[roomName];
    }
}