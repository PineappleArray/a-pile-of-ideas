class Tool {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  displayInfo(): void {
    console.log(`Name: ${this.name}`);
  }
}

export default Tool;