import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read how SafeDataFlow processes bank statements securely for conversion without database storage.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader currentPath="/privacy" />
      <main className="mx-auto max-w-4xl px-6 py-12 text-[#101828]">
        <h1 className="text-3xl font-semibold leading-tight">Privacy Policy</h1>
        <p className="mt-4 text-base leading-7 text-[#4a5565]">
          SafeDataFlow processes uploaded bank statement files only for conversion
          and parsing. We do not store statement files or parsed transaction data
          in a database.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">How Data Is Processed</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            Uploaded files are sent to our parsing service, processed in memory,
            and returned as structured output for your export workflow.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Data Retention</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            SafeDataFlow does not persist uploaded statements or conversion
            results in server-side databases as part of the current product flow.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            For privacy questions, contact your SafeDataFlow site administrator.
          </p>
        </section>
      </main>
    </div>
  );
}
