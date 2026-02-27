"use client";
import { PenTool, FileText, Users, Lightbulb } from 'lucide-react';
import ToolBar from './toolbar';
import React from 'react';
import ToolClass from './tools/tools';
import text from '../shared/notes'
import { useWebSocket } from './hooks/useWebSocket';

export default function WhiteboardPage() {
    const symbols = [
        {
            icon: PenTool
        }
    ];
    const [tool, setTool] = React.useState("None");
    const [textFields, setTextFields] = React.useState<text[]>([]);
    const [lastClick, setLastClick] = React.useState<{x:number,y:number}|null>(null);
    
    // WebSocket connection - connect to localhost:8080 (adjust URL as needed)
    const wsClient = useWebSocket('ws://localhost:8080');
    const documentId = 'default-document'; // Use your actual document ID

  function handleToolAction(x: number, y: number, e: React.MouseEvent<HTMLDivElement>){
    // Route click to the currently selected tool
    if (tool === 'text'){
      const rect = e.currentTarget.getBoundingClientRect();
      const newText = new text(x, y, Date.now().toString(), "New Text", rect.width, rect.height, 50, 200);
      setTextFields((prev) => [...prev, newText]);
      console.log('Created text at', x, y);
      return;
    }

    if (tool === 'pen'){
      console.log('Pen tool click at', x, y);
      // TODO: forward to pen tool instance / stroke start
      return;
    }

    if (tool === 'eraser' || tool === 'eraser'){
      console.log('Eraser at', x, y);
      
      return;
    }

    
    console.log('Board click at', x, y);
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLastClick({x,y});
    handleToolAction(x, y, e);
  };

  return(
    <div onClick={handleClick}>
            
<ToolBar
  onToolChange={(t: string) => {
    console.log("Tool changed:", t);
    setTool(t);
  }}
  useTool={(toolInstance) => {
    
    console.log("Using tool:", toolInstance?.name);
  }}
  wsClient={wsClient}
  documentId={documentId}
/>
  
  </div>
  );
}