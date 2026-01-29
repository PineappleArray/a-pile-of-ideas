class sketch extends data {
    constructor(height, width, dataArray, id) { 
        this.id = id;
        this.data = new Array(height);
        
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                this.data[i][j] = dataArray[i][j];
            }
        }
    }

    editData(rawX, rawY, newValue) {
        this.data[rawX][rawY] = newValue;
    }

    displayData() {
        for (let i = 0; i < this.data.length; i++) {
            console.log(this.data[i].join(' '));
        }
    }

    getId() {
        return this.id;
    }
}

export default sketch;