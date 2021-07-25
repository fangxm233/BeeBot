import { PowerBeeBaseBooster } from 'Bee/powerBeeInstances/baseBooster';
import { PowerBeeWarPusher } from 'Bee/powerBeeInstances/warPusher';
import { PowerBeeFactory } from 'Bee/PowerBeeFactory';
import { ROLE_BASE_BOOSTER, ROLE_WAR_PUSHER } from 'declarations/constantsExport';

// 注册顺序将会决定role的优先级 先注册的初始优先级高
PowerBeeFactory.registerBee(ROLE_BASE_BOOSTER, PowerBeeBaseBooster);
PowerBeeFactory.registerBee(ROLE_WAR_PUSHER, PowerBeeWarPusher);