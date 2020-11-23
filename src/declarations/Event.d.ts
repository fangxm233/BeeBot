type EventType = 'onBuildComplete' | 'onRclUpgrade';

interface OnBuildCompleteArg {
    pos: RoomPosition;
    type: BuildableStructureConstant;
}