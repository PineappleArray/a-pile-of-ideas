export class data<T> {
    x: number = 0;
    y: number = 0;
    protected id: number; 
    ts: Date = new Date();
    content: T;

  constructor(x: number, y: number, id: number, content: T, width: number, height: number) {
    this.move(x, y, width, height)
    this.id = id;
    this.content = content;
  }

  setContent(content: T){
    this.content = content
  }

  move(x: number, y: number, width: number, height: number){
    this.x = x/width;
    this.y = y/height;
  }

  getId(){
    return this.id
  }

}