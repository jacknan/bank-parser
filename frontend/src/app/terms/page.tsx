import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the SafeDataFlow terms for using our bank statement parsing and conversion service.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader currentPath="/terms" />
      <main className="mx-auto max-w-4xl px-6 py-12 text-[#101828]">
        <h1 className="text-3xl font-semibold leading-tight">Terms of Service</h1>
        <p className="mt-4 text-base leading-7 text-[#4a5565]">
          By using SafeDataFlow, you agree to these terms for bank statement
          parsing and conversion services.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Service Scope</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            SafeDataFlow provides tools to parse uploaded bank statement files and
            export structured outputs such as CSV, Excel, JSON, and QuickBooks IIF.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">User Responsibilities</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            You are responsible for ensuring you have legal rights to upload and
            process the provided documents.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">No Warranty</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            Parsing output is provided as-is and should be reviewed before use in
            accounting or compliance workflows.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            Questions about these terms can be sent through the Contact page.
          </p>
        </section>
      </main>
    </div>
  );
}
