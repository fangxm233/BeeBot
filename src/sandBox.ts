// const ops: TravelToOptions = {
//     allowHostile: false,
//     allowSK: false,
//     freshMatrix: true,
//     stuckValue: 1,
//     repath: 0.1,
//     useFindRoute: true,
//     route: {
//         E7S23: true,
//         E7S24: true,
//         E7S25: true,
//         E8S25: true,
//         E8S26: true,
//         E7S26: true,
//         E7S27: true,
//     },
// };

export function sandBox() {
    // const body = [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
    //     CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
    //     MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL, MOVE];
    //
    // const creeps = _.filter(Game.creeps, creep => creep.name.match('pia_'));
    //
    // if (creeps.length < 6) Game.rooms.E7S23.spawns.forEach(spawn => {
    //     spawn.spawnCreep(body, 'pia_' + Game.time);
    // });

    // creeps.forEach(creep => {
    //     if (creep.hitsLost) creep.heal(creep);
    //
    //     const bee = new Bee(undefined!, undefined!, creep);
    //     if (creep.room.name != 'E7S27' || creep.pos.isEdge) {
    //         bee.travelTo(new RoomPosition(18, 29, 'E7S27'), ops);
    //         return;
    //     }
    //
    //     const resource = RESOURCE_ENERGY;
    //     if (!creep.store[resource]) {
    //         if (!creep.pos.isNearTo(creep.room.storage!)) bee.travelTo(creep.room.storage!);
    //         else creep.withdraw(creep.room.storage!, resource);
    //         return;
    //     }
    //     if (!creep.pos.isNearTo(creep.room.terminal!)) bee.travelTo(creep.room.terminal!);
    //     else creep.transfer(creep.room.terminal!, resource);
    //     return;
    // });
    //
    // const t = Game.getObjectById<StructureTerminal>('600911ab1a58e81968fc510f')!;
    // if (t.store.energy > 19000) t.send(RESOURCE_ENERGY, 19000, 'E9S22');
}