import WebSocket, { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (socket: WebSocket) => {
  console.log('client connected')

  socket.on('message', (data) => {
    const message = JSON.parse(data.toString())
    console.log('received:', message)

    handleConnection(socket, message)
  })

  socket.on('close', () => {
    console.log('client disconnected')
  })

  socket.on('error', (error) => {
    console.error('socket error:', error)
  })
})

console.log('WebSocket server running on ws://localhost:8080')

function handleConnection(socket: WebSocket, message: any) {
    switch (message.type) {
        case 'delta':
            console.log('Received delta:', message);
        case 'init':
            console.log('Received init message:', message);
        case 'resize':
            console.log('Received resize message:', message);
        case 'cursor':
            console.log('Received cursor update:', message);
        case 'user-joined':
            console.log('User joined:', message);
        case 'user-left':
            console.log('User left:', message);
        default:
            console.log('Unknown message type:', message);
    }
}