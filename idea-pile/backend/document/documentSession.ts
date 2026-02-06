import { Delta } from "@/delta/deltaUtil";
export class DocumentSession {
    readonly docId: string;

    private version: number;
    private text: string;
    private history: Delta[];

    private connectedClients: Set<string>;

    constructor(docId: string, version: number, text: string, history: Delta[]){
        this.docId = docId;
        this.version = version;//Load Version
        this.text = text;//Load text
        this.history = history;
        this.connectedClients = new Set<string>();
    }

    initializeDoc(client: string): boolean{
        return false;
    }

    applyClientDelta(clientId: string, delta: Delta, baseVersion: number): ServerDeltaMessage[]{

    }

    applyDelta(delta: Delta): void {

    }

    broadcast(delta: Delta): void {

    }

    addClient(clientId: string): void {
        this.connectedClients.add(clientId);
    }
    removeClient(clientId: string): void {
        this.connectedClients.delete(clientId)
    }

    getVersion(): number {
        return this.version;
    }
    getSnapshot(): string {

    }
    

}