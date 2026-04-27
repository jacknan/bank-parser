"use client";

import { useEffect, useRef } from "react";

type AdsterraBannerProps = {
  adKey: string;
  width: number;
  height: number;
};

export default function AdsterraBanner({ adKey, width, height }: AdsterraBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = "";

    const optionsScript = document.createElement("script");
    optionsScript.type = "text/javascript";
    optionsScript.text = `window.atOptions = {
      key: '${adKey}',
      format: 'iframe',
      height: ${height},
      width: ${width},
      params: {}
    };`;

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    invokeScript.async = true;

    container.appendChild(optionsScript);
    container.appendChild(invokeScript);

    return () => {
      container.innerHTML = "";
    };
  }, [adKey, height, width]);

  return <div ref={containerRef} style={{ width, height, overflow: "hidden" }} />;
}
