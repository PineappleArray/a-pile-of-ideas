class data{
    constructor(centerX, centerY, height, width){
        this.centerX = centerX;
        this.centerY = centerY;
        this.height = height;
        this.width = width;
    }

    move(x, y){
        this.centerX += x;
        this.centerY += y;
    }

    recenter(x, y){
        this.centerX = x;
        this.centerY = y;
    }

    adjustHeight(newHeight){
        this.height = newHeight;
    }

    adjustWidth(newWidth){
        this.width = newWidth;
    } 
    
    print(){
        console.log(`CenterX: ${this.centerX}, CenterY: ${this.centerY}, Height: ${this.height}, Width: ${this.width}`);
    }
}

export default data;