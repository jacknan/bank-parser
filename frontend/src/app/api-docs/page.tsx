import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "API Documentation",
  description:
    "SafeDataFlow API endpoint details for bank statement PDF parsing and conversion.",
  alternates: {
    canonical: "/api-docs",
  },
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader currentPath="/api-docs" />
      <main className="mx-auto max-w-4xl px-6 py-12 text-[#101828]">
        <h1 className="text-3xl font-semibold leading-tight">API Documentation</h1>
        <p className="mt-2 text-base leading-7 text-[#4a5565]">
          SafeDataFlow provides a parsing endpoint for bank statement conversion
          workflows.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Endpoint</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            <code className="rounded bg-[#f3f4f6] px-2 py-1">
              POST /api/convert
            </code>
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Request</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            Send <code className="rounded bg-[#f3f4f6] px-2 py-1">multipart/form-data</code> with:
          </p>
          <ul className="mt-2 list-disc pl-6 text-base leading-7 text-[#4a5565]">
            <li>
              <code className="rounded bg-[#f3f4f6] px-2 py-1">file</code>: PDF bank statement
            </li>
            <li>
              <code className="rounded bg-[#f3f4f6] px-2 py-1">bankType</code>: CHASE, HSBC, or DEUTSCHE
            </li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Response</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            JSON with parsed statement preview, transactions, and reconciliation
            summary.
          </p>
        </section>
      </main>
    </div>
  );
}
