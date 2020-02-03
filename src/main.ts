import './prototypes/ConstructionSite';
import './prototypes/Creep';
import './prototypes/Room';
import './prototypes/RoomObject';
import './prototypes/RoomPosition';
import './prototypes/RoomStructures';
import './prototypes/RoomVisual';
import './prototypes/Structures';
import './tasks/utilities/initializer';

import actionsCounter from './profiler/actionCounter';
import stats from './profiler/stats';

import { USE_ACTION_COUNTER } from 'config';
import { profile } from 'profiler/decorator';
import { ErrorMapper, reseted } from "./ErrorMapper";
import { log } from 'console/log';

export const loop = ErrorMapper.wrapLoop(() => {
    stats.reset();
    if(USE_ACTION_COUNTER) actionsCounter.init(true);
    log.error('hi', 'debug', 'VSClink');
    stats.commit();
});

function globalReset(){
    console.log('global reset');    
}
