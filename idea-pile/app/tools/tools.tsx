class Tool {
  name: string;
  size: number;
  color: string;

  constructor(name: string, size: number, color: string) {
    this.name = name;
    this.size = size;
    this.color = color;
  }

  displayInfo(): void {
    console.log(`Name: ${this.name}`);
    console.log(`Size: ${this.size}`);
    console.log(`Color: ${this.color}`);
  }
}

export default Tool;