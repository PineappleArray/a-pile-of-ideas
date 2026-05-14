//server infrastructure, handles WebSocket connections and delegates message handling to the Gateway
import { WebSocketServer } from 'ws'
import { Gateway } from './gateway'

const wss = new WebSocketServer({ port: 8080 })
const gateway = new Gateway(wss)  //connects to gateway, kept seperate for better modularity and testability

wss.on('connection', (socket) => {
  console.log('client connected')

  socket.on('message', (data) => {
    const message = JSON.parse(data.toString())
    console.log('received:', message)

    gateway.handleConnection(socket, message)
  })

  //parse connection
  socket.on('close', () => {
    console.log('client disconnected')
  })

  socket.on('error', (error) => {
    console.error('socket error:', error)
  })
})

console.log('WebSocket server running on ws://localhost:8080')