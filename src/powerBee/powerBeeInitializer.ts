import {
    ROLE_POWER_PEACE,
    ROLE_POWER_WAR
} from 'declarations/constantsExport';
import { PowerBeePeace } from './instances/peacePowerBee';
import { PowerBeeWar } from './instances/warPowerBee';
import { PowerBeeFactory } from './powerBeeFactory';


// 注册顺序将会决定role的优先级 先注册的初始优先级高
PowerBeeFactory.registerBee(ROLE_POWER_PEACE, PowerBeePeace);
PowerBeeFactory.registerBee(ROLE_POWER_WAR, PowerBeeWar);