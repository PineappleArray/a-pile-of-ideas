//seperate gateway logic from server logic, so that we can easily swap out the gateway implementation if needed
import WebSocket, { WebSocketServer } from 'ws'
import { DocumentManager } from './document/documentManager'
import { ClientConnection } from './ws/clientConnection';
import { stickyNote } from '@/shared/notes';

export class Gateway {
  private docManager: DocumentManager;
  private wss: WebSocketServer;
  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.docManager = new DocumentManager();
  }

  public handleConnection(socket: WebSocket, message: any) {
    console.log('🔹 Gateway received:', message.type, message);
    switch (message.type) {
      case 'delta':
        console.log('-Received delta:', message);
        break
      case 'create-sticky-note':
        console.log('-Received create sticky note message:', message);
        // TODO: Broadcast to other users in the document
        break
      case 'update-sticky-note':
        console.log('-Received update sticky note message:', message);
        // TODO: Broadcast to other users in the document
        break
      case 'resize':
        console.log('-Received resize message:', message);
        break
      case 'cursor':
        //console.log('-Received cursor update:', message);
        this.docManager.updateCursor(message.userId, message.cursor);
        break
      case 'user-left':
        console.log('-User left:', message);
        this.docManager.leaveSession(message.userId);
        break
      case 'user-joined':
        console.log('-User joined:', message);
        const clientConnection = new ClientConnection(socket);
        this.docManager.joinSession(message.documentId, message.userId, clientConnection, message.initialContent);
        break
      default:
        console.log('-Unknown message type:', message);
    }
  }
}