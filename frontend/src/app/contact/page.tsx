import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact SafeDataFlow for support, privacy, and partnership inquiries.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader currentPath="/contact" />
      <main className="mx-auto max-w-4xl px-6 py-12 text-[#101828]">
        <h1 className="text-3xl font-semibold leading-tight">Contact</h1>
        <p className="mt-4 text-base leading-7 text-[#4a5565]">
          For support, privacy, or partnership requests, contact the SafeDataFlow
          team using the details below.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Support</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            Email: nan8278@gmail.com
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Business</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            Email: nan8278@gmail.com
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Response Time</h2>
          <p className="mt-2 text-base leading-7 text-[#4a5565]">
            We typically respond within 2 business days.
          </p>
        </section>
      </main>
    </div>
  );
}
