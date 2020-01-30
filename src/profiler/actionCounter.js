/**
 Module: actionCounter
 Author: fangxm, Scorpior_gh
 Date:   2019.12.27
 Usage:
 module:main
 let actionCounter = require('actionCounter')

 actionCounter.warpActions();

 //your modules go here

 module.exports.loop=function(){
     actionCounter.init();

     //your codes go here

     actionCounter.save(1500);
     //you can use console.log(actionCounter.ratio()) after actionCounter.save() to auto print cpu ratio
 }

 The module can count the times of action and measure the CPU used by it.
*/

let warpGetUsed = false;

let totalCPU = 0;
let actionsTime = {};
var historyTotalCPU = {};
var historyForcedCPU = {};

let functionsToWarp = [
    {name: 'Game.notify', parent: Game, val: Game.notify},
    {name: 'Market.cancelOrder', parent: Game.market, val: Game.market.cancelOrder},
    {name: 'Market.changeOrderPrice', parent: Game.market, val: Game.market.changeOrderPrice},
    {name: 'Market.createOrder', parent: Game.market, val: Game.market.createOrder},
    {name: 'Market.deal', parent: Game.market, val: Game.market.deal},
    {name: 'Market.extendOrder', parent: Game.market, val: Game.market.extendOrder},
    {name: 'ConstructionSite.remove', parent: ConstructionSite.prototype, val: ConstructionSite.prototype.remove},
    {name: 'Creep.attack', parent: Creep.prototype, val: Creep.prototype.attack},
    {name: 'Creep.attackController', parent: Creep.prototype, val: Creep.prototype.attackController},
    {name: 'Creep.build', parent: Creep.prototype, val: Creep.prototype.build},
    {name: 'Creep.claimController', parent: Creep.prototype, val: Creep.prototype.claimController},
    {name: 'Creep.dismantle', parent: Creep.prototype, val: Creep.prototype.dismantle},
    {name: 'Creep.drop', parent: Creep.prototype, val: Creep.prototype.drop},
    {name: 'Creep.generateSafeMode', parent: Creep.prototype, val: Creep.prototype.generateSafeMode},
    {name: 'Creep.harvest', parent: Creep.prototype, val: Creep.prototype.harvest},
    {name: 'Creep.heal', parent: Creep.prototype, val: Creep.prototype.heal},
    {name: 'Creep.move', parent: Creep.prototype, val: Creep.prototype.move},
    {name: 'Creep.notifyWhenAttacked', parent: Creep.prototype, val: Creep.prototype.notifyWhenAttacked},
    {name: 'Creep.pickup', parent: Creep.prototype, val: Creep.prototype.pickup},
    {name: 'Creep.rangedAttack', parent: Creep.prototype, val: Creep.prototype.rangedAttack},
    {name: 'Creep.rangedHeal', parent: Creep.prototype, val: Creep.prototype.rangedHeal},
    {name: 'Creep.rangedMassAttack', parent: Creep.prototype, val: Creep.prototype.rangedMassAttack},
    {name: 'Creep.repair', parent: Creep.prototype, val: Creep.prototype.repair},
    {name: 'Creep.reserveController', parent: Creep.prototype, val: Creep.prototype.reserveController},
    {name: 'Creep.signController', parent: Creep.prototype, val: Creep.prototype.signController},
    {name: 'Creep.suicide', parent: Creep.prototype, val: Creep.prototype.suicide},
    {name: 'Creep.transfer', parent: Creep.prototype, val: Creep.prototype.transfer},
    {name: 'Creep.upgradeController', parent: Creep.prototype, val: Creep.prototype.upgradeController},
    {name: 'Creep.withdraw', parent: Creep.prototype, val: Creep.prototype.withdraw},
    {name: 'Flag.remove', parent: Flag.prototype, val: Flag.prototype.remove},
    {name: 'Flag.setColor', parent: Flag.prototype, val: Flag.prototype.setColor},
    {name: 'Flag.setPosition', parent: Flag.prototype, val: Flag.prototype.setPosition},
    {name: 'PowerCreep.delete', parent: PowerCreep.prototype, val: PowerCreep.prototype.delete},
    {name: 'PowerCreep.drop', parent: PowerCreep.prototype, val: PowerCreep.prototype.drop},
    {name: 'PowerCreep.enableRoom', parent: PowerCreep.prototype, val: PowerCreep.prototype.enableRoom},
    {name: 'PowerCreep.move', parent: PowerCreep.prototype, val: PowerCreep.prototype.move},
    {name: 'PowerCreep.notifyWhenAttacked', parent: PowerCreep.prototype, val: PowerCreep.prototype.notifyWhenAttacked},
    {name: 'PowerCreep.pickup', parent: PowerCreep.prototype, val: PowerCreep.prototype.pickup},
    {name: 'PowerCreep.renew', parent: PowerCreep.prototype, val: PowerCreep.prototype.renew},
    {name: 'PowerCreep.spawn', parent: PowerCreep.prototype, val: PowerCreep.prototype.spawn},
    {name: 'PowerCreep.suicide', parent: PowerCreep.prototype, val: PowerCreep.prototype.suicide},
    {name: 'PowerCreep.transfer', parent: PowerCreep.prototype, val: PowerCreep.prototype.transfer},
    {name: 'PowerCreep.upgrade', parent: PowerCreep.prototype, val: PowerCreep.prototype.upgrade},
    {name: 'PowerCreep.usePower', parent: PowerCreep.prototype, val: PowerCreep.prototype.usePower},
    {name: 'PowerCreep.withdraw', parent: PowerCreep.prototype, val: PowerCreep.prototype.withdraw},
    {name: 'Room.createConstructionSite', parent: Room.prototype, val: Room.prototype.createConstructionSite},
    {name: 'Room.createFlag', parent: Room.prototype, val: Room.prototype.createFlag},
    {name: 'Structure.destroy', parent: Structure.prototype, val: Structure.prototype.destroy},
    {name: 'Structure.notifyWhenAttacked', parent: Structure.prototype, val: Structure.prototype.notifyWhenAttacked},
    {name: 'StructureController.activateSafeMode', parent: StructureController.prototype, val: StructureController.prototype.activateSafeMode},
    {name: 'StructureController.unclaim', parent: StructureController.prototype, val: StructureController.prototype.unclaim},
    {name: 'StructureFactory.produce', parent: StructureFactory.prototype, val: StructureFactory.prototype.produce},
    {name: 'StructureLab.boostCreep', parent: StructureLab.prototype, val: StructureLab.prototype.boostCreep},
    {name: 'StructureLab.runReaction', parent: StructureLab.prototype, val: StructureLab.prototype.runReaction},
    {name: 'StructureLab.unboostCreep', parent: StructureLab.prototype, val: StructureLab.prototype.unboostCreep},
    {name: 'StructureLink.transferEnergy', parent: StructureLink.prototype, val: StructureLink.prototype.transferEnergy},
    {name: 'StructureNuker.launchNuke', parent: StructureNuker.prototype, val: StructureNuker.prototype.launchNuke},
    {name: 'StructureObserver.observeRoom', parent: StructureObserver.prototype, val: StructureObserver.prototype.observeRoom},
    {name: 'StructurePowerSpawn.processPower', parent: StructurePowerSpawn.prototype, val: StructurePowerSpawn.prototype.processPower},
    {name: 'StructureRampart.setPublic', parent: StructureRampart.prototype, val: StructureRampart.prototype.setPublic},
    {name: 'StructureSpawn.spawnCreep', parent: StructureSpawn.prototype, val: StructureSpawn.prototype.spawnCreep},
    {name: 'StructureSpawn.recycleCreep', parent: StructureSpawn.prototype, val: StructureSpawn.prototype.recycleCreep},
    {name: 'StructureSpawn.renewCreep', parent: StructureSpawn.prototype, val: StructureSpawn.prototype.renewCreep},
    {name: 'Spawning.cancel', parent: StructureSpawn.Spawning.prototype, val: StructureSpawn.Spawning.prototype.cancel},
    {name: 'Spawning.setDirections', parent: StructureSpawn.Spawning.prototype, val: StructureSpawn.Spawning.prototype.setDirections},
    {name: 'StructureTerminal.send', parent: StructureTerminal.prototype, val: StructureTerminal.prototype.send},
    {name: 'StructureTower.attack', parent: StructureTower.prototype, val: StructureTower.prototype.attack},
    {name: 'StructureTower.heal', parent: StructureTower.prototype, val: StructureTower.prototype.heal},
    {name: 'StructureTower.repair', parent: StructureTower.prototype, val: StructureTower.prototype.repair},
]

/**
 * Warp functions, it should be call when global reset.
 */
function warpActions(){
    functionsToWarp.forEach(({name, parent, val}) => warpAction(name, parent, val))
}

function warpAction(name, parent, action){
    let actionName = name.split('.').pop();

    function warppedAction() {
        const start = warpGetUsed ? Game.cpu._getUsed() : Game.cpu.getUsed();

        let code = action.apply(this, arguments);

        const end = warpGetUsed ? Game.cpu._getUsed() : Game.cpu.getUsed();
        if(code === OK) {
            if(!actionsTime[name]){
                actionsTime[name] = {calls: 0, CPU: 0};
            }
            actionsTime[name].calls++;
            actionsTime[name].CPU += end - start;
            totalCPU += end - start;
        }

        return code;
    }

    parent['_' + actionName] = action;
    parent[actionName] = warppedAction;
}

/**
 * Initialize the actionCounter. It should be call at the begining of your code every tick.
 * @param warpGetUsedCPU if true the function Game.cpu.getUsed will return the used CPU without action cost.
 */
function init(warpGetUsedCPU = false) {
    warpGetUsed = warpGetUsedCPU;
    actionsTime = {};
    totalCPU = 0;

    function warppedFunction(){
        return Game.cpu._getUsed() - totalCPU;
    }

    if(warpGetUsed && !Game.cpu._getUsed) {
        Game.cpu._getUsed = Game.cpu.getUsed;
        Game.cpu.getUsed = warppedFunction;
    }

    global.ActionCounter = {get singleTick(){ return singleTick() }  , get ratio(){ return ratio() }};
}

/**
 * @returns The formatted usage.
 */
function singleTick() {
    const cpu = warpGetUsed ? Game.cpu._getUsed() : Game.cpu.getUsed();
    const totalCalls = _.sum(actionsTime, obj => obj.calls);
    const totalCPU = _.sum(actionsTime, obj => obj.CPU);

    const header = 'calls\t\ttime\t\tavg\t\taction';
    const footer = [
        `Avg: ${(totalCPU / totalCalls).toFixed(2)}`,
        `TotalCPU: ${totalCPU.toFixed(2)}`,
        `TotalAction: ${totalCalls}`,
        `Ratio: ${(totalCPU / cpu).toFixed(2)}%`
    ].join('\t');

    // const stats = 
    const lines = [header];
    const allLines = Object.keys(actionsTime).map(actionName => {
        const action = actionsTime[actionName];
        return {
            name: actionName,
            calls: action.calls,
            totalCPU: action.CPU,
            avg: action.CPU / action.calls,
        };
    }).sort((val1, val2) => val2.totalCPU - val1.totalCPU)
        .map(data => [
            data.calls, data.totalCPU.toFixed(2), 
            data.avg.toFixed(2), 
            data.name
        ].join('\t\t'));
    for (const line of allLines) {
        lines.push(line);
    }
    lines.push(footer);
    return lines.join('\n');
}

/**
 * @returns Returns actionData by now
 */
function getData(){
    return {
        actionsTime: actionsTime,
        totalCalls: _.sum(actionsTime, obj => obj.calls),
        totalCPU: totalCPU,
    }
}

/**
 *  保存当前tick的cpu用量
 *  @param {number} length 需要保存的历史记录tick数量，越大开销越高，建议1500
 */
function save(length){
    let cpu_used = warpGetUsed ? Game.cpu._getUsed() : Game.cpu.getUsed();
    let index = Game.time%length;
    historyTotalCPU[index] = cpu_used;
    historyForcedCPU[index] = totalCPU;
}

/**
 * @returns 返回string:不超过 {length} tick 的总cpu与强制cpu比例
 */
function ratio(){
    let total_sum = 0;
    let forced_sum = 0;
    let length = 0;
    for(let i in historyTotalCPU){
        total_sum += historyTotalCPU[i];
        forced_sum += historyForcedCPU[i];
        length += 1;
    }
    return `⏲️ 前 ${length}tick 平均cpu: ${(total_sum / length).toFixed(3)}, 平均强制cpu: ${(forced_sum / length).toFixed(3)}, 比例: ${(forced_sum / total_sum).toFixed(3)}`;
}


module.exports = {
    /**
     * Warp functions, it should be call when global reset.
    */
    warpActions: warpActions,

    /**
     * Initialize the actionCounter. It should be call at the begining of your code every tick.
     * @param {boolean} warpGetUsedCPU if true the function Game.cpu.getUsed will return the used CPU without action cost.
     */
    init: init,

    /**
     * @returns The formatted usage.
     */
    singleTick: singleTick,

    /**
     * @returns Returns actionData by now
     */
    getData: getData,
    
    /**
     *  保存当前tick的cpu用量
     *  @param {number} length 需要保存的历史记录tick数量，越大开销越高，建议1500
     */
    save: save,

    /**
     * @returns 返回string:不超过 {length} tick 的总cpu与强制cpu比例
     */
    ratio: ratio
}