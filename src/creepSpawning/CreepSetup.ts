import { profile } from "profiler/decorator";

export interface BodySetup {
    ratio: BodyRatio;
    maxSize: number;
    prefix?: BodyPartConstant[];
    suffix?: BodyPartConstant[];
    scaleWithBodySize?: boolean;
    padding?: BodyRatio;
}

export interface BodyRatio {
    [body: string]: number
}

@profile
export class CreepSetup {
    public role: string;
    public bodySetup: BodySetup;

    constructor(role: string, setup: BodySetup) {
        this.role = role;
        this.bodySetup = setup;
    }

    public generateCreepBody(budget: number): BodyPartConstant[] {
        // 计算一个单元的价格和数目
        let costPreUnit = 0;
        let countPreUnit = 0;
        // 计算前置后置
        if(this.bodySetup.scaleWithBodySize) {
            if(this.bodySetup.prefix) {
                countPreUnit += this.bodySetup.prefix.length;
                costPreUnit += _.sum(this.bodySetup.prefix, part => BODYPART_COST[part]);
            }
            if(this.bodySetup.suffix) {
                countPreUnit += this.bodySetup.suffix.length;
                costPreUnit += _.sum(this.bodySetup.suffix, part => BODYPART_COST[part]);
            }
        }
        // 计算主体价格
        costPreUnit += _.sum(this.bodySetup.ratio, part => BODYPART_COST[part] * this.bodySetup.ratio[part]);

        // 计算用于缩放的最大数目
        let maxSize = MAX_CREEP_SIZE;
        if(!this.bodySetup.scaleWithBodySize) {
            if(this.bodySetup.prefix) maxSize -= this.bodySetup.prefix.length;
            if(this.bodySetup.suffix) maxSize -= this.bodySetup.suffix.length;
        }
        maxSize = Math.min(maxSize, this.bodySetup.maxSize * countPreUnit);

        // 计算缩放倍数
        let multiple = Math.floor(budget / costPreUnit);
        if(multiple * countPreUnit > maxSize) multiple = Math.floor(maxSize / countPreUnit);

        // 生成creep身体
        const body: BodyPartConstant[] = [];
        // 添加前缀
        if(this.bodySetup.prefix) {
            for (let i = 0; i < (this.bodySetup.scaleWithBodySize ? multiple : 1); i++) {
                body.concat(this.bodySetup.prefix);
            }
        }

        // 添加主体
        _.forEach(this.bodySetup.ratio, (ratio, part) => {
            if(!part) return;
            for (let i = 0; i < multiple * ratio; i++) {
                body.push(part as BodyPartConstant);
            }
        });

        // 添加后缀
        if(this.bodySetup.suffix) {
            for (let i = 0; i < (this.bodySetup.scaleWithBodySize ? multiple : 1); i++) {
                body.concat(this.bodySetup.suffix);
            }
        }

        return body;
    }
}