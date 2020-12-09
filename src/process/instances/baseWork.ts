import { ROAD_CONSTRUCT_RCL } from "basePlanner/BaseConstructor";
import { RoomPlanner } from "basePlanner/RoomPlanner";
import { BeeBot } from "BeeBot/BeeBot";
import { setups } from "beeSpawning/setups";
import { WishConfig, WishManager } from "beeSpawning/WishManager";
import { PROCESS_MINE_SOURCE, ROLE_MANAGER, ROLE_WORKER } from "declarations/constantsExport";
import { PROCESS_BASE_WORK } from "declarations/constantsExport";
import { event } from "event/Event";
import { Process } from "process/Process"
import { profile } from "profiler/decorator";
import { ProcessMineSource } from "./mineSource";

@profile
export class ProcessBaseWork extends Process {
    private maxWorkerCount: number;
    private spawnManager: boolean;
    private workerConfig: WishConfig;
    private managerConfig: WishConfig;
    private colonyStage: ColonyStage;
    private inited: boolean;

    constructor(roomName: string) {
        super(roomName, PROCESS_BASE_WORK);
        this.wishManager = new WishManager(roomName, roomName, this);
        this.wishManager.setDefault('budget', Infinity);

        event.addEventListener('onRclUpgrade', () => this.init())
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessBaseWork(roomName);
    }

    public run() {
        this.foreachBee(ROLE_WORKER, bee => bee.run());
        this.foreachBee(ROLE_MANAGER, bee => bee.run());
    }

    private chooseSetup(): boolean {
        if (this.colonyStage != 'early') {
            this.workerConfig.setup = setups[ROLE_WORKER].default;
        } else {
            this.workerConfig.setup = setups[ROLE_WORKER].early;
        }

        return true;
    }

    private judgeMaxCount() {
        const processes = Process.getProcesses<ProcessMineSource>(this.roomName, PROCESS_MINE_SOURCE);
        return this.maxWorkerCount = _.sum(processes, process => process.sources?.length) * 5;
    }

    private init(): boolean {
        const room = Game.rooms[this.roomName];
        if (!room) return false;

        this.workerConfig = { role: ROLE_WORKER };
        this.managerConfig = { role: ROLE_MANAGER, setup: setups[ROLE_MANAGER].default } // 容量1500

        this.colonyStage = BeeBot.getColonyStage(this.roomName) || 'early';

        if (room.controller!.level >= 5) {
            this.spawnManager = true;
        }

        this.judgeMaxCount();

        return this.chooseSetup();
    }

    public wishCreeps() {
        if (!this.inited && !this.init()) return;

        const room = Game.rooms[this.roomName];
        const controller = room?.controller;
        if (!room || !controller) {
            this.close(true);
            return;
        }

        this.wishManager.clear();

        let bodies: BodyPartConstant[] | undefined = undefined;
        bodies = this.workerConfig.setup!.generateCreepBody(room.energyCapacityAvailable);
        const MAX_WORKERS = this.maxWorkerCount;
        const buildSites = room.find(FIND_CONSTRUCTION_SITES);
        BeeBot.getOutposts(room.name).forEach(roomName => {
            const data = RoomPlanner.getRoomData(roomName);
            if (!data) return;
            buildSites.push(..._.filter(Game.constructionSites,
                site => _.find(data.sourcesPath, path => path.path.find(pos => site.pos.isEqualTo(pos)))));
        });
        const buildTicks = _.sum(buildSites,
            site => Math.max(site.progressTotal - site.progress, 0)) / BUILD_POWER;
        let numWorkers = Math.ceil(2 * (5 * buildTicks) /
            (bodies.length / 3 * CREEP_LIFE_TIME));
        numWorkers = Math.min(numWorkers, MAX_WORKERS);
        if (this.colonyStage == 'early') numWorkers = Math.max(numWorkers, MAX_WORKERS);

        const nowCount = this.getCreepAndWishCount(ROLE_WORKER);
        if (nowCount < numWorkers) {
            this.wishManager.wishBee(_.assign(_.clone(this.workerConfig), { count: numWorkers - nowCount }));
        }

        if (this.spawnManager) {
            this.wishManager.arrangeCyclingBees(ROLE_MANAGER, this.managerConfig.setup!, this.managerConfig.budget!);
            const nowCount = this.getCreepAndWishCount(ROLE_MANAGER);
            if (nowCount < 1) this.wishManager.wishBee(this.managerConfig);
        }
    }
}