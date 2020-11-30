export function calTowerDamage(dist: number) {
    if (dist <= 5) return 600;
    else if (dist <= 20) return 600 - (dist - 5) * 30;
    else return 150;
}

export function calTowerRepairPower(dist: number) {
    if (dist <= 5) return 800;
    else if (dist <= 20) return 800 - (dist - 5) * 40;
    else return 200;
}

export function calTowerHealPower(dist: number) {
    if (dist <= 5) return 400;
    else if (dist <= 20) return 400 - (dist - 5) * 20;
    else return 100;
}

export function possibleTowerDamage(room: Room, pos: RoomPosition): number {
    return _.sum(room.towers, tower => {
        if (tower.store.energy < 10) return 0;
        let ratio = 1;
        if (tower.effects && tower.effects.length) tower.effects.forEach(effect => {
            if (effect.effect == PWR_OPERATE_TOWER) ratio = POWER_INFO[effect.effect].effect[effect.level];
        });
        return calTowerDamage(tower.pos.getRangeTo(pos)) * ratio;
    });
}

export function possibleRepairPower(room: Room, pos: RoomPosition): number {
    return _.sum(room.towers, tower => {
        if (tower.store.energy < 10) return 0;
        let ratio = 1;
        if (tower.effects && tower.effects.length) tower.effects.forEach(effect => {
            if (effect.effect == PWR_OPERATE_TOWER) ratio = POWER_INFO[effect.effect].effect[effect.level];
        });
        return calTowerRepairPower(tower.pos.getRangeTo(pos)) * ratio;
    });
}

export function possibleHealPower(room: Room, pos: RoomPosition): number {
    return _.sum(room.towers, tower => {
        if (tower.store.energy < 10) return 0;
        let ratio = 1;
        if (tower.effects && tower.effects.length) tower.effects.forEach(effect => {
            if (effect.effect == PWR_OPERATE_TOWER) ratio = POWER_INFO[effect.effect].effect[effect.level];
        });
        return calTowerHealPower(tower.pos.getRangeTo(pos)) * ratio;
    });
}

export function possibleCreepRangeDamage(body: BodyPartDefinition[], range: number, risk?: boolean): number {
    let rangePower: number = RANGED_ATTACK_POWER;
    if (range > 3) rangePower = risk ? (RANGED_ATTACK_POWER / range) : 0;
    return _.sum(body, part => part.type == RANGED_ATTACK && part.hits ?
        rangePower * (part.boost ? BOOSTS.ranged_attack[part.boost].rangedAttack : 1) : 0);
}

export function possibleCreepNearDamage(body: BodyPartDefinition[], range: number, risk?: boolean): number {
    let attackPower: number = ATTACK_POWER;
    if (range > 1) attackPower = risk ? (ATTACK_POWER / range / 2) : 0;
    return _.sum(body, part => part.type == ATTACK && part.hits ?
        attackPower * (part.boost ? BOOSTS.attack[part.boost].attack : 1) : 0);
}

export function possibleCreepDamage(body: BodyPartDefinition[], range: number, risk?: boolean): number {
    return possibleCreepNearDamage(body, range, risk) + possibleCreepRangeDamage(body, range, risk);
}

export function getHeal(body: BodyPartDefinition[], range: number) {
    let healPower: number = RANGED_HEAL_POWER;
    if (range > 3) healPower = 0;
    if (range <= 1) healPower = HEAL_POWER;
    return _.sum(body, part => part.type == HEAL && part.hits ?
        healPower * (part.boost ? BOOSTS.heal[part.boost].heal : 1) : 0);
}

export function possibleHealHits(pos: RoomPosition, creeps: Creep[]): number {
    return _.sum(creeps, c => getHeal(c.body, pos.getRangeTo(c)));
}

export function hitsOnTough(body: BodyPartDefinition[], damage: number): number {
    let hits = 0;
    let damageRemain = damage;
    for (const part of body) {
        if (!part.hits) continue;
        if (damageRemain <= 0) return hits;
        if (part.type == 'tough' && part.boost) {
            if (damageRemain * BOOSTS.tough[part.boost].damage > part.hits) {
                hits += part.hits;
                damageRemain -= part.hits / BOOSTS.tough[part.boost].damage;
            } else {
                hits += damageRemain * BOOSTS.tough[part.boost].damage;
                damageRemain = 0;
            }
            continue;
        }
        if (damageRemain > part.hits) {
            hits += part.hits;
            damageRemain -= part.hits;
        } else {
            hits += damageRemain;
            return hits;
        }
    }
    return hits + damageRemain;
}

export function possibleDamage(body: BodyPartDefinition[], pos: RoomPosition,
    username: string, heal?: boolean, towerDamage?: number, risk?: boolean): number {
    const attackers = pos.findInRange(FIND_CREEPS, risk ? 50 : 3, {
        filter: creep => creep.owner.username != username
            && (creep.bodyCounts[ATTACK] || creep.bodyCounts[RANGED_ATTACK])
    });

    let possibleDamage = _.sum(attackers,
        attacker => possibleCreepDamage(attacker.body, pos.getRangeTo(attacker), risk)) + (towerDamage || 0);
    possibleDamage = hitsOnTough(body, possibleDamage);
    let possibleHeal = 0;
    if (heal) {
        const healers = pos.findInRange(FIND_CREEPS, 3, {
            filter: creep => creep.owner.username == username && creep.bodyCounts[HEAL]
        });
        possibleHeal = possibleHealHits(pos, healers);
    }

    return possibleDamage - possibleHeal;
}

export function wouldBreakDefend(body: BodyPartDefinition[], pos: RoomPosition,
    username: string, towerDamage?: number, risk?: boolean): boolean {
    return possibleDamage(body, pos, username, true, towerDamage, risk) > 0;
}