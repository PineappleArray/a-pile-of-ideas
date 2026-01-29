import Tool from './tools';

export default class TextTool extends Tool {
    constructor(text, location) {
        super("Text", 0, 'black');
        this.text = text;
        this.location = location;
    }

    updateText(text){
        this.text = text; 
    }

    updateLocation(location){
        this.location = location;
    }

}
