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
FRONTEND: 

BACKEND:
The backend is hosted on docker and is single threaded as multi threading would introduce race conditions and complex locking mechanisms. The single threaded event loop prevents these issues while node.js handles concurrency naturally. The databases that are utilized is mongoDB for storing snapshots and the complete contents of a file and redis for storing user edits and temporary document logs. The reasoning behind using mongoDB for storing larger more permanent data is due to its noSQL and document friendly nature perfect for storing complex objects like entire files composed of multiple objects in a time and space efficient manner. The reason I chose redis for storing edits is it's quick query times, its ability to handle a high number of edits, and its auto cleanup feature, along with the benefits of being stored on RAM. The reason I chose mongoDB for storing long term data is its space efficiency over redis and the fact crashes will cause redis to lose memeory, redis stores data in RAM, making it volatile. MongoDB provides durability through persistent disk storage. Losing operations between snapshots is an acceptable trade-off for the architectural simplicity. In addition to that, while redis can have methods for data presistence in the event of crashes either periodic data snapshots or append only files they would only introduce unecessary complexity.
