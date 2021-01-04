import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { BeeMiner } from 'Bee/instances/miner';
import { BeeBot } from 'BeeBot/BeeBot';
import { BeeManager } from 'beeSpawning/BeeManager';
import { BeeSetup } from 'beeSpawning/BeeSetup';
import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { USER_NAME } from 'config';
import { Intel } from 'dataManagement/Intel';
import { PROCESS_MINE_SOURCE, ROLE_MINER } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import { coordToRoomPosition, partCount } from 'utilities/helpers';

@profile
export class ProcessMineSource extends Process {
    public sources: RoomPosition[];
    public target: string;
    public earlyOutpost: boolean;
    private minerCount: number[];
    private inited: boolean;
    private center: RoomPosition;
    private setup: BeeSetup;

    constructor(roomName: string, targetRoom: string, earlyOutpost?: boolean) {
        super(roomName, PROCESS_MINE_SOURCE);
        this.wishManager = new WishManager(roomName, targetRoom, this);
        this.target = targetRoom;
        this.earlyOutpost = !!earlyOutpost;
    }

    public get memory(): protoProcessMineSource {
        return super.memory as protoProcessMineSource;
    }

    protected getProto() {
        return { target: this.target, EO: this.earlyOutpost ? 1 : undefined };
    }

    public static getInstance(proto: protoProcessMineSource, roomName: string) {
        return new ProcessMineSource(roomName, proto.target, proto.EO ? true : undefined);
    }

    public setEarly(earlyOutpost: boolean) {
        if (earlyOutpost == this.earlyOutpost) return;
        this.earlyOutpost = earlyOutpost;
        this.memory.EO = earlyOutpost ? 1 : 0;
        this.init();
    }

    private init(): boolean {
        const targetIntel = Intel.getRoomIntel(this.target);
        const baseData = RoomPlanner.getRoomData(this.roomName);

        if (!targetIntel || !baseData) return false;

        this.center = new RoomPosition(baseData.basePos!.x + 5, baseData.basePos!.y + 5, this.roomName);
        this.sources = _.sortBy(targetIntel.sources!.map(coord => coordToRoomPosition(coord, this.target))
            , pos => pos.getMultiRoomRangeTo(this.center));

        this.wishManager.setDefault('role', ROLE_MINER);
        this.wishManager.setDefault('budget', Infinity);

        this.setup = this.chooseSetup()!;
        if (!this.setup) return false;
        if (!this.calMinerCount()) return false;
        return this.inited = true;
    }

    private chooseSetup(): BeeSetup | undefined {
        if (this.earlyOutpost) return setups[ROLE_MINER].source.outpost.early;

        const baseRoom = Game.rooms[this.roomName];
        if (!baseRoom) return;

        return _.max(_.filter(setups[ROLE_MINER].source[this.roomName == this.target ? 'base' : 'outpost'],
            (setup, name) => BeeBot.getColonyStage(this.roomName) == 'final' || name != 'heavy')
                .filter(setup => setup.minCost() <= BeeManager.getRoomEnergyCapacity(baseRoom)),
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
        if (!this.inited && !this.init()) return;
        if (this.earlyOutpost) {
            const room = Game.rooms[this.target];
            if (room && (room.owner || room.controller!.reservation
                && room.controller!.reservation.username != USER_NAME)) {
                this.close();
                return;
            }
        }

        this.foreachBee(ROLE_MINER, bee => bee.run());
    }

    public wishCreeps() {
        if (!this.inited && !this.init()) return;
        this.wishManager.clear();
        this.setup = this.chooseSetup()!;
        this.calMinerCount();

        // TODO: 修复当数量变化的时候会造成多个miner
        this.wishManager.arrangeCyclingBees(ROLE_MINER, this.setup, Infinity, ['s']);
        const beeCount = _.countBy(this.bees[ROLE_MINER], (bee: BeeMiner) => bee.memory.s);
        this.sources.forEach((pos, i) => {
            const nowCount = beeCount[i] || 0;
            if (nowCount >= this.minerCount[i]) return;
            this.wishManager.wishBee({
                setup: this.setup,
                count: this.minerCount[i] - nowCount,
                extraMemory: { s: i },
            });
            // log.debug('miner wish s: ', i, 'count: ', this.minerCount[i] - nowCount);
        });
    }
}

(global as any).ProcessMineSource = ProcessMineSource;