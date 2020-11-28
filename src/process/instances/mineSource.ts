import { RoomPlanner } from "basePlanner/RoomPlanner";
import { ROLE_MINER } from "Bee/BeeFactory";
import { BeeMiner } from "Bee/instances/miner";
import { BeeManager } from "beeSpawning/BeeManager";
import { BeeSetup } from "beeSpawning/BeeSetup";
import { setups } from "beeSpawning/setups";
import { WishManager } from "beeSpawning/WishManager";
import { Intel } from "dataManagement/Intel";
import { Process } from "process/Process";
import { PROCESS_MINE_SOURCE, PROCESS_SCOUT } from "process/Processes";
import { profile } from "profiler/decorator";
import { coordToRoomPosition, partCount } from "utilities/helpers";
import { ProcessScout } from "./scout";

@profile
export class ProcessMineSource extends Process {
    public memory: protoProcessMineSource;
    public sources: RoomPosition[];
    public target: string;
    private minerCount: number[];
    private inited: boolean;
    private center: RoomPosition;
    private setup: BeeSetup;

    constructor(roomName: string, targetRoom: string) {
        super(roomName, PROCESS_MINE_SOURCE);
        this.wishManager = new WishManager(roomName, targetRoom, this);
        this.target = targetRoom;
        this.init();
    }

    protected getProto() {
        return { target: this.target };
    }

    public static getInstance(proto: protoProcessMineSource, roomName: string) {
        return new ProcessMineSource(roomName, proto.target);
    }

    private init(): boolean {
        const targetIntel = Intel.getRoomIntel(this.target);
        const baseIntel = Intel.getRoomIntel(this.roomName);
        const baseData = RoomPlanner.getRoomData(this.roomName);
        const targetRoom = Game.rooms[this.target];
        const baseRoom = Game.rooms[this.roomName];

        if (!targetIntel || !baseIntel || !baseData || !baseRoom) return false;
        if (!targetRoom) {
            let scout = Process.getProcess<ProcessScout>(this.roomName, PROCESS_SCOUT);
            if (!scout) {
                scout = new ProcessScout(this.roomName);
                Process.startProcess(scout);
            }

            scout.requestScout(this.target);
            return false;
        }

        this.center = coordToRoomPosition(baseData.basePos!, this.roomName);
        this.sources = targetIntel.sources!.map(coord => coordToRoomPosition(coord, this.target))
            .sort((pos1, pos2) => pos1.getMultiRoomRangeTo(this.center) - pos2.getMultiRoomRangeTo(this.center));

        this.wishManager.setDefault('role', ROLE_MINER);
        this.wishManager.setDefault('budget', Infinity);

        this.setup = this.chooseSetup()!;
        if (!this.setup) return false;
        if (!this.calMinerCount()) return false;

        return this.inited = true;
    }

    private chooseSetup(): BeeSetup | undefined {
        const baseRoom = Game.rooms[this.roomName];
        if (!baseRoom) return;

        return _.max(_.sortBy(setups[ROLE_MINER].source[this.roomName == this.target ? 'base' : 'outpost'],
            setup => setup.minCost())
            .filter(setup => setup.minCost() < BeeManager.getRoomEnergyCapacity(baseRoom)),
            setup => setup.maxCost());
    }

    private calMinerCount(): boolean {
        const baseRoom = Game.rooms[this.roomName];
        const targetRoom = Game.rooms[this.target];
        if (!baseRoom || !targetRoom || !this.setup) return false;

        this.minerCount = [];
        const count = partCount(this.setup.generateCreepBody(BeeManager.getRoomEnergyCapacity(baseRoom)), WORK);
        this.sources.forEach((pos, i) =>
            this.minerCount[i] = Math.min(pos.availableNeighbors(true, true).length, Math.ceil(5 / count)));
        return true;
    }

    public run() {
        this.foreachBee(ROLE_MINER, bee => bee.run());
    }

    public wishCreeps() {
        if (!this.inited && !this.init()) return;
        this.chooseSetup();
        this.calMinerCount();

        this.wishManager.arrangeCyclingBees(ROLE_MINER, this.setup, Infinity, ['s']);
        const beeCount = _.countBy(this.bees[ROLE_MINER], (bee: BeeMiner) => bee.memory.s);
        const wishCount = _.countBy(this.wishManager.wishes, wish => wish.extraMemory.s);
        this.sources.forEach((pos, i) => {
            const nowCount = (beeCount[i] || 0) + (wishCount[i] || 0);
            if (nowCount >= this.minerCount[i]) return;
            this.wishManager.wishBee({ setup: this.setup, count: this.minerCount[i] - nowCount, extraMemory: { s: i } });
        });
    }
}