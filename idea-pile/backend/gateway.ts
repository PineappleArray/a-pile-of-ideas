//seperate gateway logic from server logic, so that we can easily swap out the gateway implementation if needed
import WebSocket, { WebSocketServer } from 'ws'
import { DocumentManager } from './document/documentManager'

export class Gateway {
  private docManager: DocumentManager;
  private wss: WebSocketServer;
  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.docManager = new DocumentManager();
  }

  public handleConnection(socket: WebSocket, message: any) {
    switch (message.type) {
      case 'delta':
        console.log('-Received delta:', message);
        break
      case 'create-sticky-note':
        console.log('-Received create sticky note message:', message);
        break
      case 'resize':
        console.log('-Received resize message:', message);
        break
      case 'cursor':
        console.log('-Received cursor update:', message);
        break
      case 'user-joined':
        console.log('-User joined:', message);
        break
      case 'user-left':
        console.log('-User left:', message);
        break
      default:
        console.log('-Unknown message type:', message);
    }
  }
}