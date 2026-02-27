"use client";
import React, { useState } from 'react';
import Tool from './tools/tools'; // Assuming Tool type is defined elsewhere in your project
import Pen from './tools/penTool'; // Assuming Pen type is defined elsewhere in your project
import PenTool from './tools/penTool';
import onCanvasClick from './tools/textbox';
import { useEffect, useRef } from 'react';
import text, { stickyNote } from '../shared/notes'
import { findOverlaps } from './stickyNote';
import { IWebSocketClient } from './hooks/useWebSocket';

// TopBar.jsx
// Tailwind-ready React component. Default-exported so you can drop it into a Next.js / Create React App project.

type ToolBarProps = {
  onToolChange?: (tool: string) => void;
  useTool?: (tool: Tool) => void;
  wsClient?: IWebSocketClient;
  documentId?: string;
};
const instanceTool = new PenTool(16);
const notes = new Array<stickyNote>();

export default function ToolBar({ onToolChange, useTool, wsClient, documentId }: ToolBarProps) {
  const [active, setActive] = useState('select');

  //This will make a map that will hold all the text objects linked to their id
  //using map for O(1) indexing
  const textMap = new Map<string, text>();   

  //This will change the tools that are selected
  function handleTool(tool: string) {
      setActive(tool);
      if (onToolChange) onToolChange(tool);
  }


  const btnBase = 'inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2';
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<Array<stickyNote>>(new Array<stickyNote>());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Clicked on container background (create new textarea)
      if (target === container) {
        const rect: DOMRect = container.getBoundingClientRect();
        const x = event.clientX - rect.left - 10;
        const y = event.clientY - rect.top - 10;
        const width = 100;
        const height = 80;

        // Check if we can insert (no overlap)
        if (!findOverlaps(notes, x, y, width, height, 0.8)) {
          // Create a new textarea
          const newArea: HTMLTextAreaElement = document.createElement('textarea');
          const boxId = `box-${Date.now()}`;

          // Style it
          newArea.style.width = width + 'px';
          newArea.style.height = height + 'px';
          newArea.style.backgroundColor = 'white';
          newArea.style.position = 'absolute';
          newArea.style.resize = 'both';
          newArea.style.border = '2px solid black';
          newArea.style.overflowY = 'hidden';
          newArea.id = boxId;

          // Position it at the click coordinates
          newArea.style.left = x + 'px';
          newArea.style.top = y + 'px';

          // Add it to the container
          container.appendChild(newArea);
          newArea.focus();
          const textObj = new text(x, y, boxId, "", -1, -1, width, height);
          textMap.set(boxId, textObj);

          // Send WebSocket message to create sticky note
          if (wsClient && documentId) {
            wsClient.send({
              type: 'create-sticky-note',
              documentId,
              id: boxId,
              x,
              y,
              width,
              height,
              content: '',
              timestamp: Date.now(),
            });
          }

          // Add input listener to send updates
          newArea.addEventListener('input', (e) => {
            const textarea = e.target as HTMLTextAreaElement;
            const updatedText = textarea.value;
            
            // Update local text object
            const localText = textMap.get(textarea.id);
            if (localText) {
              localText.editText(updatedText);
            }

            // Send WebSocket message for text update
            if (wsClient && documentId) {
              wsClient.send({
                type: 'update-sticky-note',
                documentId,
                id: textarea.id,
                content: updatedText,
                timestamp: Date.now(),
              });
            }
          });
        } else {
          console.log('Cannot place textarea - overlaps with existing element');
        }
      }

      // Clicked on a textarea (select it)
      else if (target.id?.startsWith('box-')) {
        console.log('Selected box:', target.id);
        
        // Reset all textareas to white
        container.querySelectorAll('textarea').forEach(textarea => {
          (textarea as HTMLTextAreaElement).style.backgroundColor = 'white';
        });
        
        //textMap.get(i)?.editText(target.)
        //textMap.set(target.id, )
        // Highlight selected one
        target.style.backgroundColor = 'lightblue';
      }
    };

    container.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between">

          {/* Left: app title / logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-semibold">WB</div>
            <div className="text-slate-800 font-semibold">Whiteboard</div>
          </div>

          {/* Center: tools */}
          <nav className="flex items-center gap-2"> 

            {/* Make Text (T) */}
            <button
              aria-pressed={active === 'text'}
              onClick={() => handleTool('text')}
              className={`${btnBase} ${active === 'text' ? 'bg-slate-100 shadow' : 'hover:bg-slate-50'}`}
              title="Create text"
            >
              {/* T icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                <path d="M6 4h12" />
                <path d="M12 4v16" />
                <path d="M6 20h12" />
              </svg>
              <span className="hidden sm:inline">Text</span>
            </button>

          </nav>

          {/* Right: optional actions (undo/redo etc) */}
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-2xl bg-white hover:bg-slate-50 text-sm" title="Undo">↶</button>
            <button className="px-3 py-2 rounded-2xl bg-white hover:bg-slate-50 text-sm" title="Redo">↷</button>
            <button className="px-3 py-2 rounded-2xl bg-slate-600 text-white text-sm" title="Save">Save</button>
          </div>

        </div>
      </div>
    </header>
    <div ref={containerRef} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh'
    }}></div>
    </>
  );
}