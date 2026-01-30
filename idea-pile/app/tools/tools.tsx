class Tool {
  name: string;
  size: number;
  color: string;
  data?: any; // Optional since it's not set in constructor
  location?: any; // Optional since it's not set in constructor

  constructor(name: string, size: number, color: string) {
    this.name = name;
    this.size = size;
    this.color = color;
  }

  getData(): void {
    console.log(this.data?.displayInfo());
  }

  displayInfo(): void {
    console.log(`Name: ${this.name}`);
    console.log(`Location: ${this.location}`);
    console.log(`Data: ${this.data}`);
    console.log(`Size: ${this.size}`);
    console.log(`Color: ${this.color}`);
  }
}

export default Tool;