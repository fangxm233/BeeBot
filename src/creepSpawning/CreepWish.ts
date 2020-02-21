import { profile } from "profiler/decorator";
import { CreepSetup } from "./CreepSetup";

@profile
export class CreepWish {
    public static creepWishes: { [roomName: string]: { [role: string]: CreepWish } } = {};

    public time: number;
    public setup: CreepSetup;
    public creepNum: number;

    constructor(setup: CreepSetup, creepNum: number) {
        this.setup = setup;
        this.creepNum = creepNum;
        this.time = Game.time;
    }

    public static wishCreeps(roomName: string, role: string, setup: CreepSetup, creepNum: number) {
        if (!this.creepWishes[roomName]) this.creepWishes[roomName] = {};
        const wishes = this.creepWishes[roomName][role];
        if (wishes && wishes.time === Game.time) wishes.creepNum += creepNum;
        else this.creepWishes[roomName][role] = new CreepWish(setup, creepNum);
    }
}