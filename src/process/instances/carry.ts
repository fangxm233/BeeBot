import { RoomPlanner } from "basePlanner/RoomPlanner";
import { BeeCarrier } from "Bee/instances/carrier";
import { BeeSetup } from "beeSpawning/BeeSetup";
import { setups } from "beeSpawning/setups";
import { WishManager } from "beeSpawning/WishManager";
import { ROLE_CARRIER } from "declarations/constantsExport";
import { PROCESS_CARRY } from "declarations/constantsExport";
import { Process } from "process/Process";
import { profile } from "profiler/decorator";
import { coordToRoomPosition } from "utilities/helpers";

@profile
export class ProcessCarry extends Process {
    public target: string;
    public poses: RoomPosition[];
    private setup: BeeSetup;

    constructor(roomName: string, target: string) {
        super(roomName, PROCESS_CARRY);
        this.wishManager = new WishManager(roomName, target, this);
        this.wishManager.setDefault('role', ROLE_CARRIER);
        this.wishManager.setDefault('budget', Infinity);
        this.setup = setups[ROLE_CARRIER].default;
        this.target = target;
        this.poses = [];
    }

    public static getInstance(proto: protoProcessCarry, roomName: string) {
        return new ProcessCarry(roomName, proto.target);
    }

    public getProto() {
        return { target: this.target };
    }

    public run() {
        if (!this.poses.length && !this.judgeCount()) return;
        if (!this.poses.length) {
            this.close(true);
            return;
        }

        this.foreachBee(ROLE_CARRIER, bee => bee.run());
    }

    public wishCreeps() {
        this.judgeCount();
        this.wishManager.clear();

        this.wishManager.arrangeCyclingBees(ROLE_CARRIER, this.setup, Infinity, ['i']);
        this.poses.forEach((pos, i) => {
            if (_.find(this.bees[ROLE_CARRIER], (bee: BeeCarrier) => bee.memory.i == i)) return;
            this.wishManager.wishBee({ setup: this.setup, extraMemory: { i } });
        });
    }

    private judgeCount(): boolean {
        if (this.roomName != this.target) {
            if (this.poses.length) return true;
            const data = RoomPlanner.getRoomData(this.target);
            if (!data) return false;
            this.poses = data.harvestPos.source.map(coord => coordToRoomPosition(coord, this.target));
            return true;
        }

        const data = RoomPlanner.getRoomData(this.roomName);
        const room = Game.rooms[this.roomName];
        if (!data || !room) return false;
        this.poses = _.map(data.harvestPos!.source, coord => coordToRoomPosition(coord, this.roomName))
            .filter(pos => !room.links.find(link => link.pos.isNearTo(pos)));
        return true;
    }
}