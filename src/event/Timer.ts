import { profile } from "profiler/decorator";

/**
 * 在指定时间用指定this触发回调，在全局重置时清空，需要重新添加。
 */
@profile
export class Timer {
    private timers: { [targetTick: number]: (() => any)[] } = {};

    /**
     * 每tick都调用，检查是否有计时器到时
     */
    public checkForTimesUp() {
        const timer = this.timers[Game.time];
        if (timer) {
            timer.forEach((func) => func.apply(undefined));
            this.timers[Game.time] = undefined as any;
        }
    }

    /**
     * 添加一个回调，将会在目标tick以指定this发起回调
     * @returns 返回回调ID
     */
    public callBackAtTick(targetTick: number, func: () => any): string {
        if (targetTick <= Game.time) {
            func.apply(undefined);
            return '';
        }
        if (!this.timers[targetTick]) this.timers[targetTick] = [];
        const index = this.timers[targetTick].push(func);
        return targetTick + '_' + index;
    }

    /**
     * 取消指定回调
     * @param id 要取消的回调的ID
     */
    public cancelCallBack(id: string) {
        const result = id.split('_');
        if (!this.timers[result[0]]) return;
        if (!this.timers[result[0]][result[1]]) return;
        this.timers[result[0]][result[1]] = undefined;
    }
}

export const timer = new Timer();