This project is a full stack website that mimics google docs with multiple users edit functionality and version control. The stack of this project is TypeScript and Next.js with TypeScript being chosen for its type safety and Next.js chosen due to its fast server side rendering as well as single framework for a server and client; perfect for collaborative edits and quick development. The algorithm that was chosen was the industry standard operational transformer, due to its ability to execute edits in a deterministic way to ensure sync with multiple users. The transformer works by being fed a delta which is a list of operations stored in this manner:
```
type DeltaOp = 
  | { type: 'retain'; count: number }
  | { type: 'insert'; text: string }
  | { type: 'delete'; count: number };
```
In the occurance of multiple simultaneous edits the edits will be transformed against each other in a predetermined order before being executed on the document.

FRONTEND: 
The frontend is built with React and Next.js using TypeScript. I chose to have optimistic UI rendering as it will allow for a smoother user experience and less latency then if the changes were validated first on the server. The key challenge was providing instant feedback while maintaining sync across multiple users. The tools are currently textbox creation and the ability to draw on the whiteboard (WIP) as well as having a super class of data so data can be interacted with interchangably.

For state management, I structured it in three layers: (Currently a WIP/Plan for frontend)
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
The backend is hosted on Docker and is single threaded as multi threading would introduce race conditions and complex locking mechanisms. The single threaded event loop prevents these issues while Next.js handles concurrency naturally. The databases that are utilized are mongoDB for storing snapshots and the complete contents of a file and Redis for storing user edits and temporary document logs. The reasoning behind using mongoDB for storing larger more permanent data is due to its NoSQL and document friendly nature, perfect for storing complex objects like entire files composed of multiple objects in a time and space efficient manner. The reason I chose Redis for storing edits is its quick query times, its ability to handle a high number of edits, and its auto cleanup feature, along with the benefits of being stored on RAM. The reason I chose mongoDB for storing long term data is its space efficiency over Redis and the fact crashes will cause Redis to lose memory, Redis stores data in RAM, making it volatile. MongoDB provides durability through persistent disk storage. Losing operations between snapshots is an acceptable trade-off for the architectural simplicity. In addition to that, while Redis can have methods for data presistence in the event of crashes either periodic data snapshots or append only files they would only introduce unnecessary complexity. WebSockets are used to provide persistent, bidirectional communication between the frontend and backend. This approach was selected to support low latency transmission and high volumes of real time signals. The approach of utilizing WebSockets has been validated from the unit test PerformanceWSMongo, where it was shows for the most utilized operations of applying and processing operations without taking into account creating the WebSocket it is around 4x faster then using WebHooks.

File Structure:
```
idea-pile/
├── backend/
│   ├── document/        # DocumentManager & DocumentSession (manages document instances)
│   ├── ot/              # Operation Transformers (OT logic)
│   ├── storage/         # Redis (short term) & MongoDB (persistent)
│   └── ws/              # WebSocket handling and client connections
│
├── delta/               # Universal delta structure (shared frontend/backend)
│
└── app/                 # Frontend logic
    ├── tools/           # Text editing & drawing tools (WIP)
    └── models/          # Sticky note and data models (WIP)
```

```
Operation                      In-Memory   MongoDB + Webhooks   WebSocket + MongoDB  
Single operation apply         0.004 ms    14 ms                14 ms                 
Real-time broadcast (50 users) 0.002 ms    N/A                  2.86 ms               
Snapshot save (single)         N/A         15-27 ms             15-27 ms            
Cursor update                  0.004 ms    N/A                  13 ms             
Session recovery               N/A         16 ms                27 ms        
```
Note: These are under test conditions on servers hosted on Docker for consistency with in memory being a Redis server and map for snapshot storage, while MongoDB and Webhooks are comprised of a Redis and MongoDB server.

While it may seem that WebSockets are a sub optimal choice in terms of efficiency when subtracting the overhead required to make a connection WebSockets are around 4x faster in terms of applying operations.

WIP:
Finish the frontend
Change OT to work better on text boxes
