export function sandBox() {
    // @ts-ignore
    if (Game.cpu.generatePixel && Game.cpu.bucket == 10000) {
        Game.cpu.generatePixel();
    }
}