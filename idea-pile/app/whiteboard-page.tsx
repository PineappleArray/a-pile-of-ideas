"use client";
import { PenTool, FileText, Users, Lightbulb } from 'lucide-react';
import ToolBar from './toolbar';
import React from 'react';
import ToolClass from './api/whiteboards/tools/tools';
import { text } from '../models/text'
export default function WhiteboardPage() {
    const symbols = [
        {
            icon: PenTool
        }
    ];
    const [tool, setTool] = React.useState("None");
    const [fontSize, setFontSize] = React.useState(16);
    const [textFields, setTextFields] = React.useState<text[]>([]);
    const [lastClick, setLastClick] = React.useState<{x:number,y:number}|null>(null);

  function handleToolAction(x: number, y: number, e: React.MouseEvent<HTMLDivElement>){
    // Route click to the currently selected tool
    if (tool === 'text'){
      const rect = e.currentTarget.getBoundingClientRect();
      const newText = new text(x, y, Date.now(), "New Text", rect.width, rect.height, 50, 200);
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
      // TODO: perform erase at x,y
      return;
    }

    // default: just record coords
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
            
  {textFields.map((t) => {
    console.log("Rendering text field:", {
    id: t.getId(),
    x: t.x,
    y: t.y,
    fontSize: t.fontSize,
    width: t.box_width,
    height: t.box_height,
  });

  return (
    <div
      key={t.getId()}
      className="absolute"
      style={{
        left: t.x,
        top: t.y,
        fontSize: t.fontSize,
        color: t.color,
        textAlign: t.align,
        width: t.box_width,
        height: t.box_height,
      }}
    >
      {t.content}
    </div>
  );
})}

            
<ToolBar
  onToolChange={(t: string) => {
    console.log("Tool changed:", t);
    setTool(t);
  }}
  onFontSizeChange={(size: React.SetStateAction<number>) => {
    console.log("Font size changed:", size);
    setFontSize(size);
  }}
  useTool={(toolInstance) => {
    
    console.log("Using tool:", toolInstance?.name);
  }}/>
  
  </div>
  );
}