"use client";
import React, { use, useCallback, useState } from 'react';
import Tool from './tools/tools'; // Assuming Tool type is defined elsewhere in your project
import onCanvasClick from './tools/textbox';
import { useEffect, useRef } from 'react';
import text, { stickyNote } from '../shared/notes'
import { findOverlaps } from './stickyNote';
import { useWebSocket, WebSocketClient } from './hooks/useWebSocket';
import TextTool from './tools/textTool';
import { set, throttle } from 'lodash';
import { createPortal } from 'react-dom';

type ToolBarProps = {
  onToolChange?: (tool: string) => void;
  useTool?: (tool: Tool) => void;
  wsClient?: WebSocketClient;
  documentId?: string;
};


const instanceTool = new TextTool('', {x:0,y:0});
const userId = Math.random().toString(36).substring(2, 15); // Placeholder user ID, replace with actual user management logic

export default function ToolBar({ onToolChange, useTool, wsClient, documentId }: ToolBarProps) {
  const [active, setActive] = useState('select');
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState<Map<string, stickyNote>>(new Map<string, stickyNote>());
  //const [cursors, setCursors] = useState<Map<string, {x: number, y: number}>>(new Map()); // Map of userId to cursor position
  const cursorElements = useRef<Map<string, HTMLElement>>(new Map());

    const handleWebSocketMessage = useCallback((message: any) => {
    console.log("TM message type:", message.type, "to: ",userId);
    switch (message.type) {
      // Sticky note operations
      case 'create-sticky-note':
        setNotes(prev => new Map(prev).set(message.id, new stickyNote(
          message.centerX,
          message.centerY,
          message.id,
          message.content,
          -1,
          -1,
          message.width,
          message.height
        )))
        break

      case 'update-sticky-note':
        setNotes(prev => { 
          const next = new Map(prev)
          const note = next.get(message.id)
          if (note) next.get(message.id)?.editText(message.content)
          return next
        })
        break

      //jser joined or left, update cursors
      case 'user-joined':
        console.log('user joined:', message.userId)
        
        break

      case 'user-left': 
        const cursorEle = cursorElements.current.get(message.userId);
        if (cursorEle) {
          cursorEle.remove();
          cursorElements.current.delete(message.userId);
        }
        break

      // Document operations
      case 'delta':
        console.log('Received delta:', message.delta, 'version:', message.version, 'author:', message.author)
        // TODO: Apply operational transformation delta
        break

      case 'init':
        console.log('Received init:', message.content, 'version:', message.version, 'users:', message.users)
        // TODO: Initialize document with content and set active users
        break

      // User interactions
      case 'cursor':
        console.log('Cursor update from', message.userId, ':', message.cursor)
        const uId = message.userId;
        const cursorPos: { x: number; y: number } = message.cursor;
        console.log('Current cursor elements:', Array.from(cursorElements.current.keys()));
        let cursorEl = document.getElementById(`cursor-${uId}`);
        if (!cursorEl) {
          console.log('Creating cursor element for user', uId);
          cursorEl = document.createElement('div');
          cursorEl.id = `cursor-${uId}`;
          cursorEl.style.position = 'fixed';
          cursorEl.style.pointerEvents = 'none';
          cursorEl.style.transform = `translate(${cursorPos.x}px, ${cursorPos.y}px)`;
          cursorEl.textContent = uId;
          cursorEl.style.minWidth = '20px';
          cursorEl.style.minHeight = '20px';
          cursorEl.style.backgroundColor = 'rgba(0, 0, 255, 0.7)';
          cursorEl.style.color = '#ff0000';
          cursorEl.style.fontSize = '12px';
          cursorEl.style.zIndex = '99999';
          document.body.appendChild(cursorEl);
          cursorElements.current.set(uId, cursorEl);
        } else {
          console.log('Updating cursor position for user', uId, 'to:', cursorPos);
          cursorEl.style.transform = `translate(${cursorPos.x}px, ${cursorPos.y}px)`;
        }
      break

      case 'move':
        console.log('Move from', message.userId, 'to:', message.x, message.y)
        // TODO: Update element position for user
        break

      case 'resize':
        console.log('Resize from', message.userId, ':', message.width, 'x', message.height)
        // TODO: Update element size for user
        break

      // Error handling
      case 'error':
        console.error('WebSocket error:', message.error)
        // TODO: Display error notification to user
        break

      // Unknown message type
      default:
        console.warn('Unknown message type:', message.type, message)
    }
  }, []);

  const { send, isConnected } = useWebSocket('ws://localhost:8080', {
    onMessage: handleWebSocketMessage
  })

useEffect(() => {
  if (!documentId || !isConnected) return;
  send({
    type: 'user-joined',
    userId,
    documentId
  });
}, [documentId, isConnected]);

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (event: MouseEvent) => {
      mouseDownPos.current = { x: event.clientX, y: event.clientY}
      const target = event.target as HTMLElement
      if (!target.id?.startsWith('box-')) return

      event.stopPropagation()

      const startX = event.clientX - target.offsetLeft
      const startY = event.clientY - target.offsetTop
      //console.log(`Mouse down on ${target.id} at (${event.clientX}, ${event.clientY}), startX: ${startX}, startY: ${startY}`)
      let isDragging = false

      const onMouseMove = (e: MouseEvent) => {

        //only start dragging after moving 8px so it wont happen when highlighting text
        //if (!isDragging && dx < 8 && dy < 8) return  this doesnt work
        if(!isDragging && ((startX < 0 && startX > target.offsetWidth) || startY > 10)) return
    
        isDragging = true
        target.style.left = e.clientX - startX + 'px'
        target.style.top = e.clientY - startY + 'px'

        if (wsClient && documentId) {
          console.log('Sending create-sticky-note message for', target);
          wsClient.send({
            type: 'create-sticky-note',
            documentId,
            id: target.id,
            x: parseInt(target.style.left),
            y: parseInt(target.style.top),
            width: parseInt(target.style.width),
            height: parseInt(target.style.height),
            content: notes.get(target.id)?.text || '',
            timestamp: Date.now(),
          });

        }
      }
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (mouseDownPos.current) {
        const dx = Math.abs(event.clientX - mouseDownPos.current.x)
        const dy = Math.abs(event.clientY - mouseDownPos.current.y)
        if (dx > 5 || dy > 5) return
      }

      // Use mousedown position instead of click position
      const origin = mouseDownPos.current ?? { x: event.clientX, y: event.clientY }

      const rect = container.getBoundingClientRect();
      const x = origin.x - rect.left - 10;
      const y = origin.y - rect.top - 10;

      //Clicked on container background (create new textarea)
      if (target === container) {
        const rect: DOMRect = container.getBoundingClientRect();
        const x = event.clientX - rect.  left - 10;
        const y = event.clientY - rect.top - 10;
        const width = 100;
        const height = 80;
        //Check if we can insert (no overlap)
        if (isEditing == false && !findOverlaps(notes, x, y, width, height, 0.2)) {
          const newArea: HTMLTextAreaElement = document.createElement('textarea');
          const boxId = `box-${userId}-${Date.now()}`;
          setNotes(prev => new Map(prev).set(boxId, new stickyNote(x, y, boxId, "", -1, -1, width, height)));

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
            console.log('Sending create-sticky-note message for', boxId);
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

          newArea.addEventListener('mousedown', (e) => {
            setIsEditing(true);
          });
        } else if (!findOverlaps(notes, x, y, width, height, 0.2)) {
          setIsEditing(false);
          console.log('EDITINGBOX IS FALSE');
        }
      }  
    };

    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousedown', handleClick);
    
    // Cleanup
    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mousedown', handleClick);
    };
  }, [wsClient, documentId, notes, userId]);   //dependency array includes notes to ensure it has the latest state when checking for overlaps

  //send cursor position on mouse move, throttled to 100ms to reduce network traffic
  useEffect(() => {
    const handler = throttle((e: MouseEvent) => {
      if (wsClient && documentId) {
        wsClient.send({
          type: 'cursor',
          userId,
          cursor: { x: e.clientX, y: e.clientY },
        });
      }
    }, 100);

    document.addEventListener('mousemove', handler);
    return () => document.removeEventListener('mousemove', handler);
  }, [wsClient, documentId]);


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