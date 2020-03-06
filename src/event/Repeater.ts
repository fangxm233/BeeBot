import { profile } from "profiler/decorator";

@profile
export class Repeater {
    private actions: {[interval: number]: {
        actionThis: any, 
        action: (...arg: any) => ScreepsReturnCode,
        fallBack: (actionThis?: any) => any,
    }[]} = {};

    public repeatActions() {
        _.forEach(this.actions, (actions, interval) => {
            if(Game.time % (interval! as any) !== 0) return;
            for (let i = 0; i < actions.length; i++) {
                const {actionThis, action, fallBack} = actions[i];
                const code = action.apply(actionThis);
                if(code !== OK) {
                    fallBack.apply(actionThis, actionThis);
                    actions.splice(i--);
                }
            }
        });
    }

    public addAction(interval: number, actionThis: any, 
        action: (...arg: any) => ScreepsReturnCode,
        fallBack: (actionThis?: any) => any) {
        if(!this.actions[interval]) this.actions[interval] = [];
        this.actions[interval].push({actionThis, action, fallBack});
    }
}