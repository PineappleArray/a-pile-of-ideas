import Data from './data'; // adjust the import path as needed

class Text extends Data {
    text: string;

    constructor(centerX: number, centerY: number, height: number, width: number, text: string) {
        super(centerX, centerY, height, width); // Call parent constructor
        this.text = text;
    }

    editText(newText: string): void {
        this.text = newText;
    }

    print(): void {
        super.print();
        console.log(this.text);
    }
}

export default Text;