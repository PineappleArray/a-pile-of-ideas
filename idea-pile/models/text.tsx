import Data from './data'; // adjust the import path as needed

export class text extends Data {

    fontSize: number; 
    color: string; 
    align: "left" | "center" | "right"; // text alignment
    box_width?: number;      // optional box width for wrapping
    box_height?: number;     // optional box height (autosize or fixed)

    constructor(x: number, y: number, id: number, content: string, screen_width: number, screen_height: number, box_height: number, box_width: number){
        super(x, y, id, screen_width, screen_height);

        this.fontSize = 16;
        this.color = "#000000";
        this.align = "left";

        this.box_height = box_height;
        this.box_width = box_width;
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