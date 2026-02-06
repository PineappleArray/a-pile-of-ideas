import { DocumentSession } from './documentSession'
class DocumentManager {
    private sessions: Map<string, DocumentSession>;

    constructor(){
        this.sessions = new Map<string, DocumentSession>();
    }

    getSession(docId: string): DocumentSession {
        const res = this.sessions.get(docId);
        if(!res){
            throw new Error("INVALID DOCUMENT ID");
        } else {
            return res;
        }
    }

    closeSession(docId: string): void {

    }

    handleClientDelta(clientId: string, msg: DeltaMessage): void {

    }

}