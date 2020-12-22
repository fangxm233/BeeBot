import { BaseConstructor } from 'basePlanner/BaseConstructor';
import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { PriorityManager } from 'beeSpawning/PriorityManager';
import {
    PROCESS_BASE_WORK,
    PROCESS_CARRY, PROCESS_DEFEND_INVADER, PROCESS_DEFEND_INVADER_CORE,
    PROCESS_FILLING,
    PROCESS_MINE_SOURCE,
    PROCESS_RESERVING,
    PROCESS_TOWER,
} from 'declarations/constantsExport';
import { clock } from 'event/Clock';
import { event } from 'event/Event';
import { ProcessBaseWork } from 'process/instances/baseWork';
import { ProcessCarry } from 'process/instances/carry';
import { ProcessColonize } from 'process/instances/colonize';
import { ProcessDefendInvader } from 'process/instances/defendInvader';
import { ProcessDefendInvaderCore } from 'process/instances/defendInvaderCore';
import { ProcessFilling } from 'process/instances/filling';
import { ProcessMineSource } from 'process/instances/mineSource';
import { ProcessRepair } from 'process/instances/repair';
import { ProcessReserving } from 'process/instances/reserving';
import { ProcessTower } from 'process/instances/tower';
import { ProcessUpgrade } from 'process/instances/upgrade';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import { Cartographer, ROOMTYPE_CONTROLLER } from 'utilities/Cartographer';
import { hasAggressiveParts } from 'utilities/helpers';
import { getAllColonyRooms } from 'utilities/utils';
import { Intel } from 'dataManagement/Intel';

const EARLY_OUTPOST_DEPTH = 1;

@profile
export class BeeBot {
    public static getObservers(): StructureObserver[] {
        return _.compact(this.colonies().map(room => room.observer!));
    }

    public static colonies(): Room[] {
        return getAllColonyRooms();
    }

    public static OnGlobalRested() {
        this.colonies().forEach(room => {
            const roomName = room.name;
            BaseConstructor.get(roomName);
            PriorityManager.arrangePriority(roomName);
            this.setupColonyEvents(roomName);
        });
    }

    public static setupColonyEvents(roomName: string) {
        event.addEventListener('onBuildComplete', (arg: OnBuildCompleteArg) => {
            if (arg.pos.roomName != roomName) return;
            const stage = this.judgeColonyStage(roomName);
            if (stage != this.getColonyStage(roomName))
                this.onColonyStageUpgrade(roomName, stage);
            if (arg.type == STRUCTURE_TOWER && !Process.getProcess<ProcessTower>(roomName, PROCESS_TOWER))
                Process.startProcess(new ProcessTower(roomName));
        });
        clock.addAction(100, () => this.routineCheck(roomName));
        clock.addAction(10, () => this.checkOutpostInvaders(roomName));
    }

    public static goOutpost(from: string, to: string) {
        if (!Memory.beebot.outposts[from]) Memory.beebot.outposts[from] = [];
        if (_.contains(Memory.beebot.outposts[from], to)) return;
        Memory.beebot.outposts[from].push(to);
        const mineSource = Process.getProcess<ProcessMineSource>(from, PROCESS_MINE_SOURCE, 'target', to);
        if(mineSource?.earlyOutpost) mineSource.setEarly(false);
        if (!mineSource) Process.startProcess(new ProcessMineSource(from, to));
        if (!Process.getProcess<ProcessMineSource>(from, PROCESS_RESERVING, 'target', to))
            Process.startProcess(new ProcessReserving(from, to));
        if (!Process.getProcess<ProcessMineSource>(from, PROCESS_CARRY, 'target', to))
            Process.startProcess(new ProcessCarry(from, to));
        const result = RoomPlanner.planRoom(from, to, true);
        if (result.result) BaseConstructor.get(from).constructBuildings();
    }

    public static cancelOutpost(from: string, to: string) {
        if (!Memory.beebot.outposts[from]) return;
        if (!_.contains(Memory.beebot.outposts[from], to)) return;
        if (_.contains(this.getOutposts(from), 'to')) return;
        _.pull(Memory.beebot.outposts[from], to);
        Process.getProcess<ProcessMineSource>(from, PROCESS_MINE_SOURCE, 'target', to)?.close();
        Process.getProcess<ProcessReserving>(from, PROCESS_RESERVING, 'target', to)?.close();
        Process.getProcess<ProcessCarry>(from, PROCESS_CARRY, 'target', to)?.close();
        RoomPlanner.removeRoomData(to);
    }

    public static getOutposts(roomName: string) {
        return Memory.beebot.outposts[roomName] || [];
    }

    public static getEarlyOutposts(roomName: string) {
        return Cartographer.findRoomsInRange(roomName, EARLY_OUTPOST_DEPTH)
            .filter(outPost => Cartographer.roomType(outPost) == ROOMTYPE_CONTROLLER
                && outPost != roomName && !Intel.getRoomIntel(outPost, true)?.owner);
    }

    public static arrangeOutposts(roomName: string) { // TODO: auto outposts arrangement
        _.forEach(Game.flags, (flag, name) => {
            if (!name!.match('preOutpost')) return;
            const from = name!.split('_')[1];
            if (from != roomName) return;
            this.goOutpost(roomName, flag.pos.roomName);
            flag.remove();
        });
    }

    private static startEarlyOutposts(roomName: string) {
        this.getEarlyOutposts(roomName).forEach(outpost => {
            if (Process.getProcess<ProcessMineSource>(roomName, PROCESS_MINE_SOURCE, 'target', outpost)) return;
            const process = new ProcessMineSource(roomName, outpost, true);
            Process.startProcess(process);
        });
    }

    public static cancelEarlyOutposts(roomName: string) {
        this.getEarlyOutposts(roomName).forEach(room => {
            const process = Process.getProcess<ProcessMineSource>(roomName, PROCESS_MINE_SOURCE, 'target', room);
            if(!process?.earlyOutpost) return;
            process.close();
        });
    }

    private static onColonyStageUpgrade(roomName: string, stage: ColonyStage) {
        this.setColonyStage(roomName, stage);
        if (stage == 'medium') {
            this.arrangeOutposts(roomName);
            this.cancelEarlyOutposts(roomName);
            Process.startProcess(new ProcessCarry(roomName, roomName));
            const upgrade = new ProcessUpgrade(roomName);
            Process.startProcess(upgrade);
            const baseWork = Process.getProcess<ProcessBaseWork>(roomName, PROCESS_BASE_WORK);
            if (baseWork) upgrade.setParent(baseWork.fullId);
            Process.startProcess(new ProcessRepair(roomName));
        }
    }

    public static run() {
        this.colonies().forEach(room => this.checkForSafeMode(room));
    }

    public static initializeColony(roomName: string) {
        const stage = this.judgeColonyStage(roomName);
        this.setColonyStage(roomName, stage);

        if (!Process.getProcess(roomName, PROCESS_FILLING))
            Process.startProcess(new ProcessFilling(roomName));
        if (!Process.getProcess(roomName, PROCESS_MINE_SOURCE))
            Process.startProcess(new ProcessMineSource(roomName, roomName));
        if (!Process.getProcess(roomName, PROCESS_BASE_WORK))
            Process.startProcess(new ProcessBaseWork(roomName));
        this.startEarlyOutposts(roomName);
        BaseConstructor.get(roomName).clearRoom();
    }

    public static routineCheck(roomName: string) {
        const room = Game.rooms[roomName];
        if (!room) return;
        if (!Process.getProcess<ProcessTower>(roomName, PROCESS_TOWER) && room.towers.length)
            Process.startProcess(new ProcessTower(roomName));
    }

    private static judgeColonyStage(roomName: string): ColonyStage {
        const room = Game.rooms[roomName];
        const level = room.controller!.level;
        if (level == 8) return 'final';
        if (level < 4) return 'early';
        if (level > 4) return 'medium';
        if (room.storage && room.storage.my) return 'medium';
        else return 'early';
    }

    public static colonize(from: string, to: string) {
        Process.startProcess(new ProcessColonize(to, from));
    }

    public static getColonyStage(roomName: string): ColonyStage | undefined {
        return Memory.beebot.colonies[roomName]?.stage;
    }

    public static setColonyStage(roomName: string, stage: ColonyStage) {
        if (!Memory.beebot.colonies[roomName]) Memory.beebot.colonies[roomName] = { stage };
        else Memory.beebot.colonies[roomName].stage = stage;
    }

    private static checkForSafeMode(room: Room) {
        const data = RoomPlanner.getRoomData(room.name);
        if (!data) return;
        const danger = room.find(FIND_HOSTILE_CREEPS).filter(creep => hasAggressiveParts(creep))
            .filter(creep => creep.pos.inRangeTo(data.basePos!.x + 5, data.basePos!.y + 5, 8)
            || creep.pos.inRangeTo(room.controller!, 1))
            .filter(creep => creep.owner.username != 'Invader');

        if (danger.length) {
            const code = room.controller!.activateSafeMode();
            if(code === OK) Game.notify(`Room ${room.name} is under attacking! SafeMode activated.
            tick: ${Game.time} owner: ${JSON.stringify(danger.map(creep => creep.owner.username))} 
            part: ${JSON.stringify(danger.map(creep => creep.bodyCounts))}`);
        }
    }

    private static checkOutpostInvaders(roomName: string) {
        const outposts = Memory.beebot.outposts[roomName];
        if(!outposts?.length) return;
        outposts.forEach(outpost => {
            const room = Game.rooms[outpost];
            if(!room) return;
            if(room.invaderCore) {
                const process = Process.getProcess<ProcessDefendInvaderCore>(roomName, PROCESS_DEFEND_INVADER_CORE, 'target', outpost);
                if(!process) Process.startProcess(new ProcessDefendInvaderCore(roomName, outpost));
            }

            const invaders = room.find(FIND_HOSTILE_CREEPS).filter(creep => hasAggressiveParts(creep, false));
            if(invaders.length) {
                const process = Process.getProcess<ProcessDefendInvader>(roomName, PROCESS_DEFEND_INVADER, 'target', outpost);
                if(!process) Process.startProcess(new ProcessDefendInvader(roomName, outpost));
            }
        })
    }
}

(global as any).BeeBot = BeeBot;