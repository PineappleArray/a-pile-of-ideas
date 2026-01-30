"use client";
import React, { useState } from 'react';
import Tool from './tools/tools'; // Assuming Tool type is defined elsewhere in your project
import Pen from './tools/penTool'; // Assuming Pen type is defined elsewhere in your project
import PenTool from './tools/penTool';
import onCanvasClick from './tools/textbox';

// TopBar.jsx
// Tailwind-ready React component. Default-exported so you can drop it into a Next.js / Create React App project.

type ToolBarProps = {
  onToolChange?: (tool: string) => void;
  onFontSizeChange?: (size: number) => void;
  useTool?: (tool: Tool) => void;
};
const instanceTool = new PenTool(16, 'Blue');


export default function ToolBar({ onToolChange, onFontSizeChange, useTool }: ToolBarProps) {
  const [active, setActive] = useState('select');
  const [fontSize, setFontSize] = useState(16);

  function handleTool(tool: string) {
      setActive(tool);
      if (onToolChange) onToolChange(tool);
  }

  function handleSizeChange(sym: string) {
    const newSize = sym == "+" ? fontSize + 1 : fontSize - 1;
    setFontSize(newSize);
    if (onFontSizeChange) onFontSizeChange(newSize);
  }

  function enableClickToCreateDivs(containerSelector: string): void {
  const container: HTMLElement | null = document.querySelector(containerSelector);
  
  if (!container) {
    console.error('Container not found');
    return;
  }
  
  // Make sure the container has position relative for absolute positioning to work
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  
  container.addEventListener('click', function(event: MouseEvent): void {
    // Only create a div if clicking directly on the container, not its children
    if (event.target !== container) {
      return;
    }
    
    // Create a new div
    const newArea: HTMLTextAreaElement = document.createElement('textarea');
    
    // Style it as a black square
    newArea.style.width = '100px';
    newArea.style.height = '80px';
    newArea.style.backgroundColor = 'white';
    newArea.style.position = 'absolute';
    newArea.style.resize = 'both';
    newArea.style.border = '2px solid black';
    newArea.style.overflowY = "hidden";

    // Position it at the click coordinates (centered on click point)
    const rect: DOMRect = container.getBoundingClientRect();
    newArea.style.left = (event.clientX - rect.left - 10) + 'px';
    newArea.style.top = (event.clientY - rect.top - 10) + 'px';
    
    // Add it to the container
    container.appendChild(newArea);
    newArea.focus();
  });
}

// Usage:
document.addEventListener('DOMContentLoaded', function() {
  enableClickToCreateDivs('#myContainer');
});


  const btnBase = 'inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2';

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
    <div id="myContainer" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh'
    }}></div>
    </>
  );
}