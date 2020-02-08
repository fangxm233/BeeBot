import { profile } from "profiler/decorator";

/**
 * 在指定时间用指定this触发回调，在全局重置时清空，需要重新添加。
 */
@profile
export class Timer {
    private timers: {[targetTick: number]: { func: () => any, funcThis: any }[] } = {};

    /**
     * 每tick都调用，检查是否有计时器到时
     */
    public checkForTimesUp() {
        const timer = this.timers[Game.time];
        if(timer) {
            for (const {func, funcThis} of timer) {
                func.apply(funcThis);
            }
        }
    }

    /**
     * 添加一个回调，将会在目标tick以指定this发起回调
     */
    public callBackAtTick(funcThis: any, targetTick: number,  func: () => any) {
        if(!funcThis || !func) return;
        if(!this.timers[targetTick]) this.timers[targetTick] = [];
        this.timers[targetTick].push({func, funcThis});
    }
}