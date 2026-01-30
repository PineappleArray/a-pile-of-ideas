"use client";

import { useState, useRef, useEffect } from "react";

type Box = {
  id: string;
  x: number;
  y: number;
  text: string;
};

type Props = {
  onCanvasClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export default function    ({ onCanvasClick }: Props) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const newBox: Box = {
      id: crypto.randomUUID(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text: "",
    };

    setBoxes(prev => [...prev, newBox]);
    onCanvasClick?.(e); // optional callback
  };

  useEffect(() => {
    const last = boxes[boxes.length - 1];
    if (last) {
      inputRefs.current[last.id]?.focus();
    }
  }, [boxes]);

  return (
    <div onClick={handleClick} style={{ position: "relative", height: 400 }}>
      {boxes.map(box => (
        <input
          key={box.id}
          ref={el => {inputRefs.current[box.id] = el}}
        />
      ))}
    </div>
  );
}
