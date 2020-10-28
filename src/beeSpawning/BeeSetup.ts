import { profile } from "profiler/decorator";
import { calBodyCost } from "utilities/helpers";

export interface BodySetup {
    ratio: BodyRatio;
    maxSize: number;
    prefix?: BodyPartConstant[];
    suffix?: BodyPartConstant[];
    scaleWithBodySize?: boolean;
    padding?: BodyPartConstant[];
    boost?: MineralBoostConstant[];
}

export type BodyRatio = string[];

@profile
export class BeeSetup {
    public role: string;
    public bodySetup: BodySetup;

    private bodyCache: { [budget: number]: BodyPartConstant[] } = {};

    constructor(role: string, setup: BodySetup) {
        this.role = role;
        this.bodySetup = setup;
    }

    public generateCreepBody(budget: number): BodyPartConstant[] {
        // 检查缓存
        if (this.bodyCache[budget]) return this.bodyCache[budget];

        // 计算一个单元的价格和数目
        let costPreUnit = _.sum(this.bodySetup.ratio, ratio => {
            const { part, num } = BeeSetup.decodeRatio(ratio);
            return BODYPART_COST[part] * num;
        });
        let countPreUnit = _.sum(this.bodySetup.ratio);
        // 计算前置后置
        if (this.bodySetup.scaleWithBodySize) {
            if (this.bodySetup.prefix) {
                countPreUnit += this.bodySetup.prefix.length;
                costPreUnit += calBodyCost(this.bodySetup.prefix);
            }
            if (this.bodySetup.suffix) {
                countPreUnit += this.bodySetup.suffix.length;
                costPreUnit += calBodyCost(this.bodySetup.suffix);
            }
        }

        // 计算用于缩放的最大数目和预算
        let maxSize = MAX_CREEP_SIZE;
        let availableBudget = budget;
        if (!this.bodySetup.scaleWithBodySize) {
            if (this.bodySetup.prefix) {
                maxSize -= this.bodySetup.prefix.length;
                availableBudget -= calBodyCost(this.bodySetup.prefix);
            }
            if (this.bodySetup.suffix) {
                maxSize -= this.bodySetup.suffix.length;
                availableBudget -= calBodyCost(this.bodySetup.suffix);
            }
        }
        maxSize = Math.min(maxSize, this.bodySetup.maxSize * countPreUnit);

        // 计算缩放倍数
        let multiple = Math.floor(availableBudget / costPreUnit);
        if (multiple * countPreUnit > maxSize) multiple = Math.floor(maxSize / countPreUnit);

        // 生成creep身体
        const body: BodyPartConstant[] = [];
        // 添加前缀
        if (this.bodySetup.prefix) {
            for (let i = 0; i < (this.bodySetup.scaleWithBodySize ? multiple : 1); i++) {
                body.concat(this.bodySetup.prefix);
            }
        }

        // 添加主体
        _.forEach(this.bodySetup.ratio, ratio => {
            const { part, num } = BeeSetup.decodeRatio(ratio);
            for (let i = 0; i < multiple * num; i++) {
                body.push(part as BodyPartConstant);
            }
        });

        // 添加补齐
        if (this.bodySetup.padding && this.bodySetup.maxSize == Infinity) {
            const paddingCost = _.sum(this.bodySetup.padding, part => BODYPART_COST[part]);
            const paddingCount = this.bodySetup.padding.length;

            let sizeRemaining = maxSize - body.length;
            if (this.bodySetup.suffix) sizeRemaining -= this.bodySetup.suffix.length * (this.bodySetup.scaleWithBodySize ? multiple : 1);
            let budgetRemaining = budget - calBodyCost(body);
            if (this.bodySetup.suffix) budgetRemaining -= calBodyCost(this.bodySetup.suffix) * (this.bodySetup.scaleWithBodySize ? multiple : 1);

            while (sizeRemaining >= paddingCount && budgetRemaining >= paddingCost) {
                body.concat(this.bodySetup.padding);
                sizeRemaining -= paddingCount;
                budgetRemaining -= paddingCost;
            }
        }

        // 添加后缀
        if (this.bodySetup.suffix) {
            for (let i = 0; i < (this.bodySetup.scaleWithBodySize ? multiple : 1); i++) {
                body.concat(this.bodySetup.suffix);
            }
        }

        // 更新缓存并返回
        return this.bodyCache[budget] = body;
    }

    private static decodeRatio(ratio: string): { part: BodyPartConstant, num: number } {
        return { part: this.getBodyByHeadLetter(ratio[0]), num: Number.parseInt(ratio.substr(1), 10) }
    }

    private static getBodyByHeadLetter(s: string): BodyPartConstant {
        switch (s) {
            case 'm':
                return MOVE
            case 'w':
                return WORK
            case 'c':
                return CARRY
            case 'a':
                return ATTACK
            case 'r':
                return RANGED_ATTACK
            case 't':
                return TOUGH
            case 'h':
                return HEAL
            case 'C':
                return CLAIM
        }
        throw new Error("Unknown Body Head Letter!");
    }
}