class ClientConnection{
    readonly clientId: string;
    private socket: WebSocket;
    private currentDocId?: string;
    /*
    send(msg: unknown): void;
    close(): void;

    handleMessage(raw: unknown): void;
    joinDocument(docId: string): void;
    leaveDocument(): void;
*/
}