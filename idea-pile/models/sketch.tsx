import Data from "./data";

class Sketch extends Data {
    id: string | number;
    data: any[][];

    constructor(height: number, width: number, dataArray: any[][], id: string | number) {
        super(0, 0, height, width); // Call parent constructor with default centerX and centerY
        this.id = id;
        this.data = new Array(height);
        
        for (let i = 0; i < height; i++) {
            this.data[i] = new Array(width); // Initialize inner array
            for (let j = 0; j < width; j++) {
                this.data[i][j] = dataArray[i][j];
            }
        }
    }

    editData(rawX: number, rawY: number, newValue: any): void {
        this.data[rawX][rawY] = newValue;
    }

    displayData(): void {
        for (let i = 0; i < this.data.length; i++) {
            console.log(this.data[i].join(' '));
        }
    }

    getId(): string | number {
        return this.id;
    }
}

export default Sketch;