This project is a full stack website that mimics google docs with multiple user edit functionality and version control. The stack of this project is typescript and next.js with typescript
being chosen for its type safety and next.js chosen due to its fast server side rendering as well as single framework for a server and client; perfect for collaberative edits and quick development. 
The algorithm that was chosen was the industry standard operational transformer, due to its ability to execute edits in a determanistic way to ensure sync with multiple users. The transformer works
by being fed a delta which is a list of operations stored in this manner:

type DeltaOp = 
 
  | { type: 'retain'; count: number }
  
  | { type: 'insert'; text: string; attributes?: Record<string, any> }
  
  | { type: 'delete'; count: number };
  
In the occurance of multiple simultaneous edits the edits will be transformed against each other in a predetermined order before being executed on the document. I chose to have optimistic rendering
for the UI as it will allow for a smoother user experience and less latency then if the changes were validated first on the server.
