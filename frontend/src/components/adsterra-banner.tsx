type AdsterraBannerProps = {
  adKey: string;
  width: number;
  height: number;
};

export default function AdsterraBanner({ adKey, width, height }: AdsterraBannerProps) {
  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=${width},initial-scale=1" /><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;}</style></head><body><script>atOptions={key:'${adKey}',format:'iframe',height:${height},width:${width},params:{}};</script><script src="https://www.highperformanceformat.com/${adKey}/invoke.js"></script></body></html>`;

  return (
    <iframe
      title="Advertisement"
      scrolling="no"
      srcDoc={srcDoc}
      width={width}
      height={height}
      style={{
        width,
        height,
        border: 0,
        overflow: "hidden",
        background: "transparent",
        display: "block",
      }}
    />
  );
}
