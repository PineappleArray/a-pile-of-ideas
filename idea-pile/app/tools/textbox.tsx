"use client";

import { useState, useRef, useEffect } from "react";

type Box = {
  id: number;
  x: number;
  y: number;
  text: string;
};

export default function ClickCreateTextBox() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  console.log("CLicked")
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const newBox: Box = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text: "",
    };

    setBoxes((prev) => [...prev, newBox]);
  };

  // Auto-focus the newest box
  useEffect(() => {
    const last = boxes[boxes.length - 1];
    if (last) {
      inputRefs.current[last.id]?.focus();
    }
  }, [boxes]);

  return (
    <div
      onClick={handleClick}
      style={{
        position: "relative",
        width: "100%",
        height: "400px",
        border: "1px dashed gray",
        cursor: "text",
      }}
    >
      {boxes.map((box) => (
        <input
          key={box.id}
          ref={(el) => {(inputRefs.current[box.id] = el)}}
          value={box.text}
          onChange={(e) => {
            const value = e.target.value;
            setBoxes((prev) =>
              prev.map((b) =>
                b.id === box.id ? { ...b, text: value } : b
              )
            );
          }}
          style={{
            position: "absolute",
            left: box.x,
            top: box.y,
            backgroundColor: "black",
            color: "white",
            padding: "6px 8px",
            border: "none",
            outline: "none",
            borderRadius: "4px",
            width: "160px",
          }}
        />
      ))}
    </div>
  );
}
