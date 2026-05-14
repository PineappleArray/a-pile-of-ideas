import Tool from './tools'; // adjust the import path as needed

interface Location {
  x: number;
  y: number;
}

export default class TextTool extends Tool {
  text: string;
  location: Location;

  constructor(text: string, location: Location) {
    super("Text");
    this.text = text;
    this.location = location;
  }

  updateText(text: string): void {
    this.text = text;
  }

  updateLocation(location: Location): void {
    this.location = location;
  }
}