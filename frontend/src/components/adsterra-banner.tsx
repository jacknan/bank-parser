import Script from "next/script";

type AdsterraBannerProps = {
  adKey: string;
  width: number;
  height: number;
};

export default function AdsterraBanner({ adKey, width, height }: AdsterraBannerProps) {
  return (
    <div style={{ width, height, overflow: "hidden" }}>
      <Script id={`adsterra-${adKey}-options`} strategy="afterInteractive">
        {`window.atOptions = {
  key: '${adKey}',
  format: 'iframe',
  height: ${height},
  width: ${width},
  params: {}
};`}
      </Script>
      <Script
        id={`adsterra-${adKey}-invoke`}
        strategy="afterInteractive"
        src={`https://www.highperformanceformat.com/${adKey}/invoke.js`}
      />
    </div>
  );
}
