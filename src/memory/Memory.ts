export class Men {
    public static cleanCreeps() {
        // 清理不存在的creep的内存
        for (const name in Memory.creeps) {
			if (!Game.creeps[name]) {
				delete Memory.creeps[name];
			}
		}
    }
}