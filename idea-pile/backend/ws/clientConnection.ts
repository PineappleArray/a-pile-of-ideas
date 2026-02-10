export class ClientConnection{
    readonly clientId: string;
    private socket: WebSocket;
    private currentDocId?: string;
    
    send(msg: unknown): void {

    }
    close(): void {

    }

    handleMessage(raw: unknown): void {

    }
    joinDocument(type: string, docId: string, version: string): void {

    }
    leaveDocument(): void {

    }

}