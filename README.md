This project is a full stack website that mimics google docs with multiple user edit functionality and version control. The stack of this project is TypeScript and Next.js with TypeScript
being chosen for its type safety and Next.js chosen due to its fast server side rendering as well as single framework for a server and client; perfect for collaberative edits and quick development. 
The algorithm that was chosen was the industry standard operational transformer, due to its ability to execute edits in a determanistic way to ensure sync with multiple users. The transformer works
by being fed a delta which is a list of operations stored in this manner:

type DeltaOp = 
 
  | { type: 'retain'; count: number }
  
  | { type: 'insert'; text: string; attributes?: Record<string, any> }
  
  | { type: 'delete'; count: number };
  
In the occurance of multiple simultaneous edits the edits will be transformed against each other in a predetermined order before being executed on the document.

FRONTEND: 
The frontend is built with React and Next.js using TypeScript. I chose to have optimistic UI rendering as it will allow for a smoother user experience and less latency then if the changes were validated first on the server. The key challenge was providing instant feedback while maintaining sync across multiple users.
For state management, I structured it in three layers:
First, document state using useReducer - this holds the content, version number,
and any pending operations that haven't been confirmed by the server yet.
Second, connection state with useState tracking the WebSocket connection,
user session, and connection health.
Third, collaboration state with Context API managing active users, cursor
positions, and presence indicators across the whole component tree.
The WebSocket connection is managed through a custom useWebSocket hook that
handles reconnection, message passing, and error recovery automatically.
For performance, I implemented several optimizations: debounced cursor updates
to reduce network traffic, React.memo for collaboration indicators to avoid
unnecessary re-renders, and virtual scrolling for large documents.

BACKEND:
The backend is hosted on Docker and is single threaded as multi threading would introduce race conditions and complex locking mechanisms. The single threaded event loop prevents these issues while Next.js handles concurrency naturally. The databases that are utilized are mongoDB for storing snapshots and the complete contents of a file and redis for storing user edits and temporary document logs. The reasoning behind using mongoDB for storing larger more permanent data is due to its NoSQL and document friendly nature, perfect for storing complex objects like entire files composed of multiple objects in a time and space efficient manner. The reason I chose Redis for storing edits is its quick query times, its ability to handle a high number of edits, and its auto cleanup feature, along with the benefits of being stored on RAM. The reason I chose mongoDB for storing long term data is its space efficiency over Redis and the fact crashes will cause redis to lose memeory, redis stores data in RAM, making it volatile. MongoDB provides durability through persistent disk storage. Losing operations between snapshots is an acceptable trade-off for the architectural simplicity. In addition to that, while Redis can have methods for data presistence in the event of crashes either periodic data snapshots or append only files they would only introduce unnecessary complexity. WebSockets are used to provide persistent, bidirectional communication between the frontend and backend. This approach was selected to support low latency transmission and high volumes of real time signals.

File Structure:

idea-pile/

├── backend/
│   ├── document/        # DocumentManager & DocumentSession (Manages all the doc instances)
│   ├── ot/              # Operation Transformers (Manages OT logic)
│   ├── storage/         # Storage (Redis short term storage and MongoDB persistent storage)

│   └── ws/              # WebSocket handling and client connections

├── delta/               # Universal delta structure used by both front and backend

└── app/                 # Contains all the frontend logic

    ├── tools/           # Tools that handle all the text editing and drawing (WIP)

    ├── models/          # All the classes that represent the frontend sticky notes (WIP)


Operation                       In Memory   MongoDB & Webhooks  Trade-off

Session Creation (100 sessions) 0.18 ms     0.20 ms             1.1x

Document Operations (1000 ops)  3.83 ms     878.54 ms           229x

Broadcasting (50 users)         0.11 ms     0.12 ms             1.1x

Snapshot Loading (50 loads)     0.25 ms     3.56 ms             14.5x

User Join/Leave (200 users)     3.73 ms     21.95 ms            5.9x

Note: These are under test conditions on servers hosted on Dockers for consistency with in memory being a Redis server and map for snapshot storage, while MongoDB and Webhooks are comprised of a Redis and MongoDB server.