import { BaseConstructor } from "basePlanner/BaseConstructor";
import { RoomPlanner } from "basePlanner/RoomPlanner";
import { structureLayout } from "basePlanner/structurePreset";
import { USER_NAME } from "config";
import { PROCESS_FILLING, PROCESS_TOWER } from "declarations/constantsExport";
import { Process } from "process/Process";
import { possibleDamage, possibleRepairPower, possibleTowerDamage, wouldBreakDefend } from "utilities/powerCalculation";
import { ProcessFilling } from "./filling";

const REPAIR_RAMPART_LINE = 100;

export class ProcessTower extends Process {
    private inited: boolean;
    private repairList: Id<Structure>[];
    private regularRepaitList: Id<Structure>[];
    private tickToRepair: number = 0;
    private center: RoomPosition;

    constructor(roomName: string) {
        super(roomName, PROCESS_TOWER);
    }

    private init(): boolean {
        const room = Game.rooms[this.roomName];
        const data = RoomPlanner.getRoomData(this.roomName);
        if (!room || !data) return false;

        this.center = new RoomPosition(data.basePos!.x, data.basePos!.y, this.roomName);

        return this.genLists();
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessTower(roomName);
    }

    public check() {
        const room = Game.rooms[this.roomName];
        if (!room) {
            this.close();
            return false;
        }
        if (!this.inited && !this.init()) return false;

        if (room.find(FIND_HOSTILE_CREEPS).length) return true;
        if (room.find(FIND_HOSTILE_POWER_CREEPS).length) return true;
        if (room.find(FIND_MY_CREEPS).filter(creep => creep.hits < creep.hitsMax).length) return true;

        this.tickToRepair--;

        if (this.tickToRepair <= 0) {
            this.regularRepaitList = this.regularRepaitList.filter(id => !!Game.getObjectById(id));
            const structures = this.regularRepaitList.map(id => Game.getObjectById(id)!);
            if (!this.repairs(room, structures)) {
                this.tickToRepair = _.min(structures.map(structure => this.calDecalTime(structure)));
            }
        }

        return false;
    }

    public run() {
        const room = Game.rooms[this.roomName];
        if (!room) {
            this.close();
            return;
        }
        if (!this.inited && !this.init()) return;

        const hostleCreeps = [...room.find(FIND_HOSTILE_CREEPS), ...room.find(FIND_HOSTILE_POWER_CREEPS)];

        const targets = hostleCreeps.filter(creep => {
            const towerDamage = possibleTowerDamage(room, creep.pos);
            if (creep instanceof PowerCreep) {
                const damage = possibleDamage([], creep.pos, USER_NAME, true, towerDamage);
                if (damage < 0) return false;
                if (!creep.powers[PWR_SHIELD]) return true;
                const power = creep.powers[PWR_SHIELD];
                const shield = POWER_INFO[PWR_SHIELD].effect[power.level] / POWER_INFO[PWR_SHIELD].cooldown;
                return shield < damage;
            }
            return wouldBreakDefend(creep.body, creep.pos, USER_NAME, towerDamage);
        });

        if (targets.length) {
            this.aimAt(room.towers, _.min(targets, target => target.pos.getRangeTo(this.center)));
            return;
        } else if (hostleCreeps.length && Game.time % 5 == 0) {
            room.towers.forEach(tower => tower.attack(_.sample(hostleCreeps)));
            return;
        }

        const injured: AnyCreep[] = room.find(FIND_MY_CREEPS).filter(creep => creep.hits < creep.hitsMax);
        injured.push(...room.find(FIND_MY_POWER_CREEPS).filter(creep => creep.hits < creep.hitsMax));

        if (injured.length) {
            this.heal(room.towers, _.min(injured, creep => creep.hits));
            return;
        }

        this.repairList = this.repairList.filter(id => !!Game.getObjectById(id));
        const structures = this.repairList.map(id => Game.getObjectById(id)!);
        if (!this.repairs(room, structures)) {
            this.wait();
            return;
        }
    }

    private aimAt(towers: StructureTower[], target: AnyCreep) {
        towers.forEach(tower => tower.attack(target));
        if (_.find(towers, tower => tower.store.energy < 600))
            Process.getProcess<ProcessFilling>(this.roomName, PROCESS_FILLING)?.awake();
    }

    private heal(towers: StructureTower[], target: AnyCreep) {
        towers.forEach(tower => tower.heal(target));
        if (_.find(towers, tower => tower.store.energy < 600))
            Process.getProcess<ProcessFilling>(this.roomName, PROCESS_FILLING)?.awake();
    }

    private repair(towers: StructureTower[], target: Structure) {
        towers.forEach(tower => tower.repair(target));
        if (_.find(towers, tower => tower.store.energy < 600))
            Process.getProcess<ProcessFilling>(this.roomName, PROCESS_FILLING)?.awake();
    }

    private genLists(): boolean {
        const room = Game.rooms[this.roomName];
        const data = RoomPlanner.getRoomData(this.roomName);
        if (!room || !data) return false;

        const baseConstructor = BaseConstructor.get(this.roomName);

        this.regularRepaitList = [];
        this.regularRepaitList.push(
            ..._.compact(_.map([...data.harvestPos.source, data.harvestPos.mineral!, data.containerPos!.controller],
                coord => baseConstructor.getForAt(STRUCTURE_CONTAINER, coord)?.id!)));
        this.regularRepaitList.push(
            ..._.compact(_.map(structureLayout[8].buildings[STRUCTURE_CONTAINER],
                coord => baseConstructor.getForAtBase(STRUCTURE_CONTAINER, coord)?.id!)));

        let poses = _.flatten([data.controllerPath!, ...data.sourcesPath, data.mineralPath!].map(path => path.path));
        poses.push(...structureLayout[room.controller!.level].buildings[STRUCTURE_ROAD].map(
            coord => new RoomPosition(data.basePos!.x + coord.x, data.basePos!.y + coord.y, this.roomName)))
        poses = _.uniq(poses);
        this.regularRepaitList.push(..._.map(poses, pos => baseConstructor.getForAt(STRUCTURE_ROAD, pos)?.id!));

        this.repairList = [...this.regularRepaitList, ...room.find(FIND_MY_STRUCTURES).map(s => s.id)];
        this.regularRepaitList.push(...room.ramparts.map(ram => ram.id));

        return true;
    }

    private repairs(room: Room, structures: Structure[]): boolean {
        structures = structures.filter(structure => this.needToRepair(structure));

        if (!structures.length) return false;
        const structure = _.min(structures, structure => structure.hits);
        this.repair(room.towers, structure);
        return true;
    }

    private calDecalTime(structure: Structure) {
        const power = possibleRepairPower(structure.room, structure.pos);
        let hitsMax = structure.hitsMax;
        let decalAmount = 0;
        let decalTime = Infinity;
        let ticksToDecay = (structure as any).ticksToDecay;

        switch (structure.structureType) {
            case STRUCTURE_ROAD:
                decalAmount = ROAD_DECAY_AMOUNT;
                decalTime = ROAD_DECAY_TIME;
                break;
            case STRUCTURE_CONTAINER:
                decalAmount = CONTAINER_DECAY;
                decalTime = CONTAINER_DECAY_TIME_OWNED;
                break;
            case STRUCTURE_RAMPART:
                decalAmount = RAMPART_DECAY_AMOUNT;
                decalTime = RAMPART_DECAY_TIME;
                hitsMax = REPAIR_RAMPART_LINE;
                break;
            default:
                ticksToDecay = Infinity;
                break;
        }

        if (hitsMax - structure.hits > power) return 0;
        if (decalAmount == 0) return Infinity;

        return (Math.ceil(power / decalAmount) - 1) * decalTime + ticksToDecay;
    }

    private needToRepair(structure: Structure): boolean {
        if (structure.hits == structure.hitsMax) return false;
        const power = possibleRepairPower(structure.room, structure.pos);

        switch (structure.structureType) {
            case STRUCTURE_RAMPART:
                return structure.hits < REPAIR_RAMPART_LINE;
            case STRUCTURE_ROAD:
                return structure.hitsMax - structure.hits > power;
            case STRUCTURE_CONTAINER:
                return structure.hitsMax - structure.hits > power;
            default:
                return structure.structureType != STRUCTURE_WALL;
        }
    }
}