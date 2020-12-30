import { RoomPlanner } from 'basePlanner/RoomPlanner';
import { log } from 'console/log';
import { PROCESS_LAB_REACT } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';
import {
    BASE_RESOURCES,
    REAGENTS,
    ResourcesManager,
    STORAGE_COMPOUND,
    STORAGE_EXCLUDED_COMPOUND,
    TERMINAL_COMPOUND,
} from 'resourceManagement/ResourcesManager';
import { timeAfterTick } from 'utilities/helpers';

const COMPOUND_ORDER: MineralCompoundConstant[] = [
    RESOURCE_CATALYZED_LEMERGIUM_ACID,
    RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
    RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
    RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
    RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
    RESOURCE_CATALYZED_UTRIUM_ACID,
    RESOURCE_CATALYZED_GHODIUM_ACID,
    RESOURCE_CATALYZED_ZYNTHIUM_ACID,
    RESOURCE_CATALYZED_KEANIUM_ACID,
    RESOURCE_CATALYZED_UTRIUM_ALKALIDE,

    RESOURCE_LEMERGIUM_ACID,
    RESOURCE_GHODIUM_ALKALIDE,
    RESOURCE_LEMERGIUM_ALKALIDE,
    RESOURCE_ZYNTHIUM_ALKALIDE,
    RESOURCE_KEANIUM_ALKALIDE,
    RESOURCE_UTRIUM_ACID,
    RESOURCE_GHODIUM_ACID,
    RESOURCE_ZYNTHIUM_ACID,
    RESOURCE_KEANIUM_ACID,
    RESOURCE_UTRIUM_ALKALIDE,

    RESOURCE_LEMERGIUM_HYDRIDE,
    RESOURCE_GHODIUM_OXIDE,
    RESOURCE_LEMERGIUM_OXIDE,
    RESOURCE_ZYNTHIUM_OXIDE,
    RESOURCE_KEANIUM_OXIDE,
    RESOURCE_UTRIUM_HYDRIDE,
    RESOURCE_GHODIUM_HYDRIDE,
    RESOURCE_ZYNTHIUM_HYDRIDE,
    RESOURCE_KEANIUM_HYDRIDE,
    RESOURCE_UTRIUM_OXIDE,

    RESOURCE_GHODIUM,

    RESOURCE_UTRIUM_LEMERGITE,
    RESOURCE_ZYNTHIUM_KEANITE,
    RESOURCE_HYDROXIDE,
];

export const AMOUNT_PER_REACTION = 3000;
export const MIN_AMOUNT = 1500;

@profile
export class ProcessLabReact extends Process {
    public memory: protoProcessLabReact;

    constructor(roomName: string) {
        super(roomName, PROCESS_LAB_REACT);
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessLabReact(roomName);
    }

    protected getProto() {
        if (this.memory) return { state: this.reactState, amount: this.amount, type: this.targetType };
        return { state: 'none' };
    }

    public get reactState(): 'none' | 'fill' | 'react' | 'take' {
        return this.memory.state || 'none';
    }

    public set reactState(state: 'none' | 'fill' | 'react' | 'take') {
        if (state == 'take') {
            const labs = RoomPlanner.getLabs(this.roomName);
            if (!labs.length) return;
            if (!labs.find(lab => !!lab.mineralType)) state = 'none';
        }
        this.memory.state = state;
    }

    public get targetType(): MineralCompoundConstant | undefined {
        return this.memory.type;
    }

    public set targetType(type: MineralCompoundConstant | undefined) {
        this.memory.type = type;
    }

    public get components(): ResourceConstant[] {
        if (this.reactState == 'none') return [];
        return REAGENTS[this.memory.type!];
    }

    public get amount(): number {
        return this.memory.amount || 0;
    }

    public run() {
        if (this.reactState == 'fill' || this.reactState == 'take') return;

        const sourceLabs = RoomPlanner.getSourceLabs(this.roomName);
        const reactLabs = RoomPlanner.getReactionLabs(this.roomName);
        if (sourceLabs.length < 2 || !reactLabs.length) return;

        if (this.reactState == 'react') {
            if(!sourceLabs.find(lab => !!lab.mineralType)) {
                this.reactState = 'take';
                return;
            }

            const cooldownLab = reactLabs.find(lab => !!lab.cooldown);
            if (cooldownLab) {
                this.sleep(timeAfterTick(cooldownLab.cooldown));
                return;
            }

            let hasOK = false;
            reactLabs.forEach(lab => {
                const code = lab.runReaction(sourceLabs[0], sourceLabs[1]);
                if(code === OK) hasOK = true;
            });
            if(hasOK) return;
            else {
                this.reactState = 'take';
                return;
            }
        }

        const final = this.chooseFinalTarget();
        if (!final) {
            this.sleep(timeAfterTick(20));
            return;
        }

        const target = this.findTarget(final, AMOUNT_PER_REACTION, MIN_AMOUNT);
        if (!target) {
            this.sleep(timeAfterTick(20));
            return;
        }

        log.info(`Lab: room ${this.roomName} started react ${target.target}, amount: ${target.amount}.`);
        this.reactState = 'fill';
        this.targetType = target.target;
        this.memory.amount = target.amount;
    }

    private chooseFinalTarget(): MineralCompoundConstant | undefined {
        let type = COMPOUND_ORDER.find(type => ResourcesManager.getStock(this.roomName, type) < TERMINAL_COMPOUND
            && !!this.findTarget(type, AMOUNT_PER_REACTION, MIN_AMOUNT));
        if (type) return type;
        type = COMPOUND_ORDER.find(type => !_.contains(STORAGE_EXCLUDED_COMPOUND, type)
            && ResourcesManager.getStock(this.roomName, type) < STORAGE_COMPOUND + TERMINAL_COMPOUND
            && !!this.findTarget(type, AMOUNT_PER_REACTION, MIN_AMOUNT));
        return type;
    }

    private findTarget(final: MineralCompoundConstant, amount: number, minAmount: number):
        { target: MineralCompoundConstant, amount: number } | undefined {
        const components = REAGENTS[final];
        if (components.find(type => _.contains(BASE_RESOURCES, type)
            && ResourcesManager.getStock(this.roomName, type) < minAmount)) return;

        const minType = _.min(components, type => ResourcesManager.getStock(this.roomName, type));
        const minStock = ResourcesManager.getStock(this.roomName, minType);

        if (minStock < minAmount)
            return this.findTarget(minType as MineralCompoundConstant,
                this.ceilToMultiplesOf5(amount - minStock), minAmount);

        return { target: final, amount: this.floorToMultiplesOf5(Math.min(minStock, amount)) };
    }

    private floorToMultiplesOf5(amount: number): number {
        return Math.floor(amount / 5) * 5;
    }

    private ceilToMultiplesOf5(amount: number): number {
        return Math.ceil(amount / 5) * 5;
    }
}