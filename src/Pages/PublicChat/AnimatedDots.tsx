import React, { useState, useEffect } from "react";

export const AnimatedDots = ({ text }: { text: string }) => {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return <span>{text}{dots}</span>;
};
