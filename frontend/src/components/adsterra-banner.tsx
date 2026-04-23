import Script from "next/script";

type AdsterraBannerProps = {
  adKey: string;
  width: number;
  height: number;
};

export default function AdsterraBanner({ adKey, width, height }: AdsterraBannerProps) {
  return (
    <>
      <Script id={`adsterra-${adKey}-config`} strategy="afterInteractive">
        {`window.atOptions = {
  key: '${adKey}',
  format: 'iframe',
  height: ${height},
  width: ${width},
  params: {}
};`}
      </Script>
      <Script
        strategy="afterInteractive"
        src={`https://www.highperformanceformat.com/${adKey}/invoke.js`}
      />
    </>
  );
}
