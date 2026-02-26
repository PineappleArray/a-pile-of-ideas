export class stickyNote {
    box_width: number;
    box_height: number;   
    text: string;
    centerX: number;
    centerY: number
    id: string;

    constructor(x: number, y: number, id: string, text: string, screen_width: number, screen_height: number, box_height: number, box_width: number){
        this.centerX = x;
        this.centerY = y;
        this.id = id;
        this.box_height = box_height;
        this.box_width = box_width;
        this.text = text
    }

    getX(){
        return this.centerX
    }

    editText(newText: string): void {
        this.text = newText;
    }

    print(): void {
        console.log(this.text);
    }
}

export default stickyNote;