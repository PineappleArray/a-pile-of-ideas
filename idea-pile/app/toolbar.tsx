"use client";
import React, { useState } from 'react';
import Tool from './tools/tools'; // Assuming Tool type is defined elsewhere in your project
import Pen from './tools/penTool'; // Assuming Pen type is defined elsewhere in your project
import PenTool from './tools/penTool';
import onCanvasClick from './tools/textbox';
import { SpatialTree } from './utils/spatialtree';
import { useEffect, useRef } from 'react';


// TopBar.jsx
// Tailwind-ready React component. Default-exported so you can drop it into a Next.js / Create React App project.

type ToolBarProps = {
  onToolChange?: (tool: string) => void;
  onFontSizeChange?: (size: number) => void;
  useTool?: (tool: Tool) => void;
};
const instanceTool = new PenTool(16, 'Blue');
const tree = new SpatialTree()

export default function ToolBar({ onToolChange, onFontSizeChange, useTool }: ToolBarProps) {
  const [active, setActive] = useState('select');
  const [fontSize, setFontSize] = useState(16);

  //This will change the tools that are selected
  function handleTool(tool: string) {
      setActive(tool);
      if (onToolChange) onToolChange(tool);
  }


  //Changes the font when clicking on the font adjustment button
  function handleSizeChange(sym: string) {
    const newSize = sym == "+" ? fontSize + 1 : fontSize - 1;
    setFontSize(newSize);
    if (onFontSizeChange) onFontSizeChange(newSize);
  }

  
  const btnBase = 'inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2';
  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<SpatialTree>(new SpatialTree());

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
        if (!treeRef.current.hasOverlap(x, y, width, height)) {
          // Create a new textarea
          const newArea: HTMLTextAreaElement = document.createElement('textarea');

          // Style it
          newArea.style.width = width + 'px';
          newArea.style.height = height + 'px';
          newArea.style.backgroundColor = 'white';
          newArea.style.position = 'absolute';
          newArea.style.resize = 'both';
          newArea.style.border = '2px solid black';
          newArea.style.overflowY = 'hidden';
          newArea.id = `box-${Date.now()}`;

          // Position it at the click coordinates
          newArea.style.left = x + 'px';
          newArea.style.top = y + 'px';

          // Add it to the container
          container.appendChild(newArea);
          newArea.focus();

          // Add to spatial tree
          //treeRef.current.insert(x, y, width, height, newArea);
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

            {/* Text Size control */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl">
              <button onClick={() => handleSizeChange("-")} className='text-xl'>-</button>
              <label htmlFor="fontSize" className="sr-only">Font size</label>
              <input
                id="fontSize"
                type="text"
                value={fontSize}
                readOnly
                className="w-6 h-6 accent-slate-600 text-center mt-1"
              />
              <button onClick={() => handleSizeChange("+")} className='text-xl'>+</button>
              <div className="text-xs text-slate-600 w-8 text-right">{fontSize}px</div>
            </div>

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


            {/* Draw (Pen) */}
            <button
              aria-pressed={active === 'pen'}
              onClick={() => handleTool('pen')}
              className={`${btnBase} ${active === 'pen' ? 'bg-slate-100 shadow' : 'hover:bg-slate-50'}`}
              title="Draw"
            >
              {/* Pen icon (simple) */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              <span className="hidden sm:inline">Draw</span>
            </button>

            {/* Erase (Trapezoid) */}
            <button
              aria-pressed={active === 'eraser'}
              onClick={() => handleTool('eraser')}
              className={`${btnBase} ${active === 'eraser' ? 'bg-slate-100 shadow' : 'hover:bg-slate-50'}`}
              title="Erase"
            >
              {/* Trapezoid eraser icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                <path d="M3 17l6 6h6l6-6-6-6H9z" />
                <line x1="9" y1="11" x2="15" y2="17" />
              </svg>
              <span className="hidden sm:inline">Erase</span>
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

    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '600px',
        border: '2px solid #ccc',
        position: 'relative',
        backgroundColor: '#f5f5f5'
      }}
    >
      Click to create textareas
    </div>
  //);
//}


}