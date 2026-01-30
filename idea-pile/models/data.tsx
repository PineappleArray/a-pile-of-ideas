class Data {
    centerX: number;
    centerY: number;
    height: number;
    width: number;

    constructor(centerX: number, centerY: number, id: number, height: number, width: number) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.height = height;
        this.width = width;
    }

    move(x: number, y: number): void {
        this.centerX += x;
        this.centerY += y;
    }

    recenter(x: number, y: number): void {
        this.centerX = x;
        this.centerY = y;
    }

    adjustHeight(newHeight: number): void {
        this.height = newHeight;
    }

    adjustWidth(newWidth: number): void {
        this.width = newWidth;
    }

    print(): void {
        console.log(`CenterX: ${this.centerX}, CenterY: ${this.centerY}, Height: ${this.height}, Width: ${this.width}`);
    }
}

export default Data;