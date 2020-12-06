import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { Bee } from 'Bee/Bee';
import { BeeBot } from 'BeeBot/BeeBot';
import { profile } from 'profiler/decorator';
import { ResourcesManager } from 'resourceManagement/ResourcesManager';
import { Tasks } from 'tasks/Tasks';
import { fillingTargetType } from './filler';

@profile
export class BeeWorker extends Bee {

    public runCore() {
        this.task?.isValid();
        if (!this.task) {
            if (!this.store.energy) {
                this.task = ResourcesManager.getEnergySource(this, false);
            } else {
                this.chooseWork();
            }
        }
        this.task?.run();
    }

    private chooseWork() {
        const room = Game.rooms[this.process.roomName];
        if (!room) return;

        const controller = room.controller;
        const early = BeeBot.getColonyStage(room.name) == 'early';
        if (controller && controller.ticksToDowngrade <= (!early ? 10000 : 2000))
            if (this.upgradeAction()) return;

        const repairList = _.filter(room.structures, structure => structure.structureType != STRUCTURE_RAMPART
            && structure.structureType != STRUCTURE_WALL && structure.hits < structure.hitsMax * 0.1);
        if (repairList.length)
            if (this.repairAction(repairList)) return;

        if (early) {
            let structures: fillingTargetType[] =
                room.extensions.filter(ext => ext.store.getFreeCapacity(RESOURCE_ENERGY));
            structures.push(...room.spawns.filter(
                spawn => spawn.store.getFreeCapacity(RESOURCE_ENERGY)));
            structures.push(...room.towers.filter(
                tower => tower.store.getFreeCapacity(RESOURCE_ENERGY) > 400));
            structures = structures.filter(structure => !structure.targetedBy.length
                || structure.targetedBy.find(
                    targeted => targeted.pos.getRangeTo(structure) > this.pos.getRangeTo(structure)));
            if (structures.length)
                if (this.transferAction(structures)) return;
        }

        const buildSites = room.find(FIND_MY_CONSTRUCTION_SITES);
        BeeBot.getOutposts(room.name).forEach(roomName => {
            const data = RoomPlanner.getRoomData(roomName);
            if (!data) return;
            buildSites.push(..._.filter(Game.constructionSites,
                site => _.find(data.sourcesPath, path => path.path.find(pos => site.pos.isEqualTo(pos)))));
        });
        if (buildSites.length)
            if (this.buildAction(buildSites)) return;

        if (this.upgradeAction()) return;
    }

    private buildAction(buildSites: ConstructionSite[]): boolean {
        if (!buildSites.length) return false;
        const target = this.creep.pos.findClosestByMultiRoomRange(buildSites);
        if (!target) return false;
        this.task = Tasks.build(target);
        return true;
    }

    private repairAction(repairList: Structure[]): boolean {
        if (!repairList.length) return false;
        const target = this.creep.pos.findClosestByMultiRoomRange(repairList);
        if (!target) return false;
        this.task = Tasks.repair(target);
        return true;
    }

    private transferAction(targets: fillingTargetType[]): boolean {
        if (!targets.length) return false;
        const target = this.pos.findClosestByMultiRoomRange(targets);
        if (!target) return false;
        this.task = Tasks.transfer(target, RESOURCE_ENERGY);
        return true;
    }

    private upgradeAction(): boolean {
        const controller = Game.rooms[this.process.roomName].controller;
        if (controller) {
            this.task = Tasks.upgrade(controller);
            return true;
        }
        return false;
    }
}