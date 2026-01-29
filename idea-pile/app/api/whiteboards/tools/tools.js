
class tool{
    constructor(name, size, color){
        this.name = name;
        this.size = size;
        this.color = color;
    }

    getData(){
        console.log(this.data.displayInfo());
    }

    displayInfo(){
        console.log(`Name: ${this.name}`);
        console.log(`Location: ${this.location}`);
        console.log(`Data: ${this.data}`);
        console.log(`Size: ${this.size}`);
        console.log(`Color: ${this.color}`);
    }
}

export default tool;
