type AdsterraBannerProps = {
  adKey: string;
  width: number;
  height: number;
};

export default function AdsterraBanner({ adKey, width, height }: AdsterraBannerProps) {
  return (
    <div style={{ width, height, overflow: "hidden" }}>
      <script
        dangerouslySetInnerHTML={{
          __html: `atOptions = {
  key: '${adKey}',
  format: 'iframe',
  height: ${height},
  width: ${width},
  params: {}
};`,
        }}
      />
      <script src={`https://www.highperformanceformat.com/${adKey}/invoke.js`} />
    </div>
  );
}
