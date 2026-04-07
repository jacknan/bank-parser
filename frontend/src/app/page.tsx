"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const imgIcon = "/figma/icon-logo.svg";
const imgVector = "/figma/doc-vector.svg";
const imgVector1 = "/figma/doc-vector-1.svg";
const imgVector2 = "/figma/doc-vector-2.svg";
const imgVector3 = "/figma/doc-vector-3.svg";
const imgVector4 = "/figma/sheet-vector.svg";
const imgVector5 = "/figma/csv-vector.svg";
const imgVector6 = "/figma/csv-vector-1.svg";
const imgVector7 = "/figma/csv-vector-2.svg";
const imgIcon1 = "/figma/upload-icon.svg";
const imgIcon2 = "/figma/settings-icon.svg";
const imgIcon3 = "/figma/chevron-icon.svg";
const RESULT_STORAGE_KEY = "bank-parse-result";
const RESULT_BACKUP_STORAGE_KEY = "bank-parse-result-backup";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://safedataflow.com";

const SOFTWARE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SafeDataFlow",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Convert bank statement PDFs to CSV, Excel, JSON, and QuickBooks formats.",
  url: SITE_URL,
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What file formats can I export?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can export parsed bank statement data to CSV, Excel, JSON, and QuickBooks IIF.",
      },
    },
    {
      "@type": "Question",
      name: "Do you store uploaded bank statements?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Files are processed for parsing and conversion. SafeDataFlow does not store statement files in a database.",
      },
    },
    {
      "@type": "Question",
      name: "Which bank templates are currently supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Current templates include CHASE, HSBC, and DEUTSCHE.",
      },
    },
  ],
};

const BANK_OPTIONS = [
  { label: "Chase", value: "CHASE" },
  { label: "HSBC", value: "HSBC" },
  { label: "Deutsche Bank", value: "DEUTSCHE" },
  { label: "Custom", value: "CUSTOM" },
];

type UploadState = "idle" | "uploading" | "success" | "error";

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
};

export default function Home() {
  const [bankType, setBankType] = useState("CHASE");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const selectedBankLabel = useMemo(() => {
    return BANK_OPTIONS.find((option) => option.value === bankType)?.label ?? "Chase";
  }, [bankType]);

  const isUploading = uploadState === "uploading";
  const isCustom = bankType === "CUSTOM";

  useEffect(() => {
    if (!dropdownOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const resetStatus = () => {
    setUploadState("idle");
    setStatusMessage("");
  };

  const handleSelectFile = (file: File | null) => {
    if (!file) {
      return;
    }
    if (file.type && file.type !== "application/pdf") {
      setUploadState("error");
      setStatusMessage("Please upload a PDF file.");
      return;
    }
    setSelectedFile(file);
    resetStatus();
  };

  const handleBrowse = () => {
    if (isUploading) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      handleBrowse();
      return;
    }
    if (isCustom) {
      setUploadState("error");
      setStatusMessage("Custom templates are not supported yet.");
      return;
    }
    try {
      setUploadState("uploading");
      setStatusMessage("Uploading and parsing…");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("bankType", bankType);

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok) {
        if (contentType.includes("application/json")) {
          const errorPayload = await response.json();
          throw new Error(errorPayload?.error ?? "Upload failed.");
        }
        const errorText = await response.text();
        throw new Error(errorText || "Upload failed.");
      }

      const data = contentType.includes("application/json") ? await response.json() : null;
      const transactionCount = data?.preview?.transactions?.length;
      setUploadState("success");
      setStatusMessage(
        typeof transactionCount === "number"
          ? `Parsed ${transactionCount} transactions successfully.`
          : "Upload completed successfully."
      );
      if (data) {
        const serialized = JSON.stringify(data);
        sessionStorage.setItem(RESULT_STORAGE_KEY, serialized);
        localStorage.setItem(RESULT_BACKUP_STORAGE_KEY, serialized);
        router.push("/results");
      }
    } catch (error) {
      setUploadState("error");
      setStatusMessage(error instanceof Error ? error.message : "Upload failed.");
    }
  };

  const statusLine = (() => {
    if (uploadState === "success" || uploadState === "error" || uploadState === "uploading") {
      return statusMessage || " ";
    }
    if (selectedFile) {
      return `${selectedFile.name} · ${formatBytes(selectedFile.size)}`;
    }
    return "or click to browse files";
  })();

  const statusColor =
    uploadState === "error"
      ? "text-[#dc2626]"
      : uploadState === "success"
        ? "text-[#16a34a]"
        : "text-[#64748b]";

  return (
    <div
      className="bg-white min-h-screen text-[#101828]"
      data-name="Bank Statement CSV Parser"
      data-node-id="1:2"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <header
        className="bg-white border-b border-[#e5e7eb]"
        data-name="Header"
        data-node-id="1:3"
      >
        <div
          className="mx-auto w-full max-w-[1216px] min-h-[64px] px-4 py-3 sm:px-6 lg:px-0 lg:py-0 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
          data-name="Container"
          data-node-id="1:4"
        >
          <div className="h-[32px] w-[167.117px]" data-name="Container" data-node-id="1:5">
            <div className="flex items-center gap-[8px]">
              <div className="size-[32px]" data-name="Icon" data-node-id="1:6">
                <img alt="SafeDataFlow logo" className="block size-full" src={imgIcon} />
              </div>
              <div className="h-[28px]" data-name="Text" data-node-id="1:8">
                <p
                  className="font-semibold leading-[28px] text-[20px] tracking-[-0.4492px] text-[#101828]"
                  data-node-id="1:9"
                >
                  SafeDataFlow
                </p>
              </div>
            </div>
          </div>
          <nav className="-mx-1 h-auto overflow-x-auto px-1" data-name="Navigation" data-node-id="1:10" aria-label="Primary">
            <ul className="flex min-w-max items-center gap-4 sm:gap-6">
              <li data-name="Link" data-node-id="1:11">
                <Link
                  className="font-semibold leading-[24px] text-[15px] sm:text-[16px] tracking-[-0.3125px] text-[#101828] whitespace-nowrap"
                  data-node-id="1:12"
                  href="/"
                >
                  Home
                </Link>
              </li>
              <li data-name="Link" data-node-id="1:13">
                <Link
                  className="font-medium leading-[24px] text-[15px] sm:text-[16px] tracking-[-0.3125px] text-[#64748b] whitespace-nowrap"
                  data-node-id="1:14"
                  href="/privacy"
                >
                  Privacy
                </Link>
              </li>
              <li data-name="Link" data-node-id="1:15">
                <Link
                  className="font-medium leading-[24px] text-[15px] sm:text-[16px] tracking-[-0.3125px] text-[#64748b] whitespace-nowrap"
                  data-node-id="1:16"
                  href="/api-docs"
                >
                  API
                </Link>
              </li>
              <li data-name="Link">
                <Link
                  className="font-medium leading-[24px] text-[15px] sm:text-[16px] tracking-[-0.3125px] text-[#64748b] whitespace-nowrap"
                  href="/terms"
                >
                  Terms
                </Link>
              </li>
              <li data-name="Link">
                <Link
                  className="font-medium leading-[24px] text-[15px] sm:text-[16px] tracking-[-0.3125px] text-[#64748b] whitespace-nowrap"
                  href="/contact"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main
        className="bg-[#f9fafb] w-full max-w-[1280px] mx-auto mt-6 mb-6 lg:mt-[48px] lg:mb-[48px] px-4 sm:px-6 lg:px-[32px] pt-6 lg:pt-[32px] pb-6 lg:pb-[32px] flex flex-col gap-6 lg:gap-[32px]"
        data-name="Container"
        data-node-id="1:17"
      >
        <div className="flex items-start justify-center" data-name="Container" data-node-id="1:18">
          <div
            className="bg-[#f9fafb] border-2 border-[#d1d5dc] rounded-[10px] h-[90px] w-full max-w-[728px] flex items-center justify-center"
            data-name="Container"
            data-node-id="1:19"
          >
            <div className="h-[40px] w-[194.117px]" data-name="Container" data-node-id="1:20">
              <div className="flex flex-col gap-[4px] items-center">
                <p
                  className="font-medium leading-[20px] text-[14px] tracking-[-0.1504px] text-[#64748b]"
                  data-node-id="1:22"
                >
                  Advertisement - Leaderboard
                </p>
                <p
                  className="font-normal leading-[16px] text-[12px] text-[#99a1af]"
                  data-node-id="1:24"
                >
                  728x90
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 lg:gap-[32px] items-stretch xl:items-start" data-name="Container" data-node-id="1:25">
          <section
            className="bg-white rounded-[14px] w-full xl:w-[819.203px]"
            data-name="Container"
            data-node-id="1:26"
          >
            <div className="pt-6 lg:pt-[32px] px-4 sm:px-6 lg:px-[32px]">
              <div className="flex flex-col gap-[8px]" data-name="Container" data-node-id="1:27">
                <div className="min-h-[36px] flex items-center justify-center" data-name="Heading 1" data-node-id="1:28">
                  <h1
                    className="text-center font-semibold leading-[1.2] text-[26px] sm:text-[30px] tracking-[0.3955px] text-[#101828] w-full max-w-[802px]"
                    data-node-id="1:29"
                  >
                    Convert Bank Statements to CSV with 100% Accuracy
                  </h1>
                </div>
                <div className="min-h-[24px]" data-name="Paragraph" data-node-id="1:30">
                  <p
                    className="text-center font-normal leading-[24px] text-[16px] tracking-[-0.3125px] text-[#64748b] w-full max-w-[520px] mx-auto"
                    data-node-id="1:31"
                  >
                    Secure parsing. Uploaded files are processed for conversion and not stored.
                  </p>
                </div>
                <div
                  className={`border-2 rounded-[16px] min-h-[292px] py-8 lg:py-[42px] px-4 sm:px-6 lg:px-[42px] transition-colors ${
                    dragActive
                      ? "border-[#0052ff] bg-gradient-to-b from-[#eff6ff] to-white"
                      : "border-[#d1d5dc] bg-gradient-to-b from-[#f9fafb] to-white"
                  }`}
                  data-name="Container"
                  data-node-id="1:32"
                  role="button"
                  tabIndex={0}
                  onClick={handleBrowse}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleBrowse();
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) {
                      handleSelectFile(file);
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      handleSelectFile(file);
                    }}
                  />
                  <div className="flex flex-col gap-[24px] items-center w-full max-w-[671.203px] mx-auto" data-name="Container" data-node-id="1:33">
                    <div className="min-h-[56px] w-full max-w-[360px]" data-name="Container" data-node-id="1:34">
                      <div className="flex items-center justify-center gap-[12px] sm:gap-[16px]">
                        <div className="bg-[#fef2f2] rounded-[10px] size-[56px]" data-name="Container" data-node-id="1:35">
                          <div className="pt-[12px] px-[12px]">
                            <div className="h-[32px] w-[32px] relative" data-name="Icon" data-node-id="1:36">
                              <div className="absolute inset-[8.33%_16.67%]" data-name="Vector" data-node-id="1:37">
                                <img alt="Document" className="block size-full" src={imgVector} />
                              </div>
                              <div className="absolute inset-[8.33%_16.67%_66.67%_58.33%]" data-name="Vector" data-node-id="1:38">
                                <img alt="Document" className="block size-full" src={imgVector1} />
                              </div>
                              <div className="absolute inset-[37.5%_58.33%_62.5%_33.33%]" data-name="Vector" data-node-id="1:39">
                                <img alt="Document" className="block size-full" src={imgVector2} />
                              </div>
                              <div className="absolute inset-[54.17%_33.33%_45.83%_33.33%]" data-name="Vector" data-node-id="1:40">
                                <img alt="Document" className="block size-full" src={imgVector3} />
                              </div>
                              <div className="absolute inset-[70.83%_33.33%_29.17%_33.33%]" data-name="Vector" data-node-id="1:41">
                                <img alt="Document" className="block size-full" src={imgVector3} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="h-[24px] w-[14.18px]" data-name="Container" data-node-id="1:42">
                          <p
                            className="text-center font-normal leading-[24px] text-[16px] tracking-[-0.3125px] text-[#64748b]"
                            data-node-id="1:43"
                          >
                            &rarr;
                          </p>
                        </div>
                        <div className="bg-[#f0fdf4] rounded-[10px] size-[56px]" data-name="Container" data-node-id="1:44">
                          <div className="pt-[12px] px-[12px]">
                            <div className="h-[32px] w-[32px] relative" data-name="Icon" data-node-id="1:45">
                              <div className="absolute inset-[12.5%]" data-name="Vector" data-node-id="1:46">
                                <img alt="Sheet" className="block size-full" src={imgVector4} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="h-[24px] w-[14.18px]" data-name="Container" data-node-id="1:47">
                          <p
                            className="text-center font-normal leading-[24px] text-[16px] tracking-[-0.3125px] text-[#64748b]"
                            data-node-id="1:48"
                          >
                            &rarr;
                          </p>
                        </div>
                        <div className="bg-[#eff6ff] rounded-[10px] size-[56px]" data-name="Container" data-node-id="1:49">
                          <div className="pt-[12px] px-[12px]">
                            <div className="h-[32px] w-[32px] relative" data-name="Icon" data-node-id="1:50">
                              <div className="absolute inset-[8.33%_16.67%]" data-name="Vector" data-node-id="1:51">
                                <img alt="CSV" className="block size-full" src={imgVector5} />
                              </div>
                              <div className="absolute inset-[8.33%_16.67%_66.67%_58.33%]" data-name="Vector" data-node-id="1:52">
                                <img alt="CSV" className="block size-full" src={imgVector6} />
                              </div>
                              <div className="absolute inset-[54.17%_58.33%_45.83%_33.33%]" data-name="Vector" data-node-id="1:53">
                                <img alt="CSV" className="block size-full" src={imgVector7} />
                              </div>
                              <div className="absolute inset-[54.17%_33.33%_45.83%_58.33%]" data-name="Vector" data-node-id="1:54">
                                <img alt="CSV" className="block size-full" src={imgVector7} />
                              </div>
                              <div className="absolute inset-[70.83%_58.33%_29.17%_33.33%]" data-name="Vector" data-node-id="1:55">
                                <img alt="CSV" className="block size-full" src={imgVector7} />
                              </div>
                              <div className="absolute inset-[70.83%_33.33%_29.17%_58.33%]" data-name="Vector" data-node-id="1:56">
                                <img alt="CSV" className="block size-full" src={imgVector7} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full max-w-[293.336px]" data-name="Container" data-node-id="1:57">
                      <div className="flex flex-col gap-[8px] items-center">
                        <p
                          className="text-center font-medium leading-[28px] text-[18px] tracking-[-0.4395px] text-[#364153]"
                          data-node-id="1:59"
                        >
                          Drop your PDF bank statement here
                        </p>
                        <p
                          className={`text-center font-normal leading-[20px] text-[14px] tracking-[-0.1504px] ${statusColor}`}
                          data-node-id="1:61"
                        >
                          {statusLine}
                        </p>
                      </div>
                    </div>

                    <div className="h-[48px] w-full max-w-[220px]" data-name="Label" data-node-id="1:62">
                      <button
                        type="button"
                        className={`rounded-[14px] h-[48px] relative w-full transition ${
                          isUploading || isCustom
                            ? "bg-[#94a3b8] cursor-not-allowed"
                            : "bg-[#0052ff] hover:bg-[#0042cc]"
                        }`}
                        data-name="Text"
                        data-node-id="1:63"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (isUploading) {
                            return;
                          }
                          handleUpload();
                        }}
                        disabled={isUploading || isCustom}
                      >
                        <div className="absolute left-[12px] top-[16px] size-[16px]" data-name="Icon" data-node-id="1:64">
                          <img alt="Upload" className="block size-full" src={imgIcon1} />
                        </div>
                        <p
                          className="absolute left-[93px] -translate-x-1/2 top-[10px] font-semibold leading-[28px] text-[18px] tracking-[-0.4395px] text-white whitespace-nowrap w-max"
                          data-node-id="1:68"
                        >
                          {isUploading ? "Uploading..." : "Upload PDF"}
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="w-full xl:w-[364.797px]" data-name="Sidebar" data-node-id="1:69">
            <div className="flex flex-col gap-6 lg:gap-[32px] h-full">
              <div
                className="bg-white border border-[#e5e7eb] rounded-[14px] min-h-[237px] px-4 sm:px-6 lg:px-[25px] py-5 lg:py-[25px] flex flex-col gap-6 lg:gap-[40px]"
                data-name="Container"
                data-node-id="1:70"
              >
                <div className="h-[24px] w-full" data-name="Container" data-node-id="1:71">
                  <div className="flex items-center gap-[8px]">
                    <div className="size-[20px]" data-name="Icon" data-node-id="1:72">
                      <img alt="Settings" className="block size-full" src={imgIcon2} />
                    </div>
                    <div className="h-[24px] w-[63.438px]" data-name="Heading 3" data-node-id="1:75">
                      <p
                        className="font-semibold leading-[24px] text-[16px] tracking-[-0.3125px] text-[#101828]"
                        data-node-id="1:76"
                      >
                        Settings
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full" data-name="Container" data-node-id="1:77">
                  <div className="flex flex-col gap-[16px]">
                    <div className="flex flex-col gap-[8px] h-[58px]" data-name="Container" data-node-id="1:78">
                      <p
                        className="font-medium leading-[14px] text-[14px] tracking-[-0.1504px] text-[#364153]"
                        data-node-id="1:80"
                      >
                        Bank Template
                      </p>
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          className="bg-[#f3f3f5] border border-[#d1d5dc] rounded-[8px] h-[36px] px-[13px] flex items-center justify-between w-full"
                          data-name="Primitive.button"
                          data-node-id="1:81"
                          onClick={() => setDropdownOpen((open) => !open)}
                        >
                          <div className="h-[20px]" data-name="Primitive.span" data-node-id="1:82">
                            <p
                              className="font-normal leading-[20px] text-[14px] tracking-[-0.1504px] text-[#0a0a0a]"
                              data-node-id="1:83"
                            >
                              {selectedBankLabel}
                            </p>
                          </div>
                          <div className="size-[16px]" data-name="Icon" data-node-id="1:84">
                            <img alt="Chevron" className="block size-full" src={imgIcon3} />
                          </div>
                        </button>
                        {dropdownOpen && (
                          <div
                            className="absolute left-0 top-[40px] w-full bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0_8px_24px_rgba(15,23,42,0.08)] py-[8px] z-10"
                            role="listbox"
                          >
                            {BANK_OPTIONS.map((option) => {
                              const isSelected = option.value === bankType;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={`w-full px-[14px] py-[8px] flex items-center justify-between text-left text-[14px] leading-[20px] transition ${
                                    isSelected ? "bg-[#f1f5f9] text-[#0f172a]" : "hover:bg-[#f8fafc] text-[#0f172a]"
                                  }`}
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => {
                                    setBankType(option.value);
                                    setDropdownOpen(false);
                                    resetStatus();
                                  }}
                                >
                                  <span>{option.label}</span>
                                  {isSelected && <span className="text-[#2563eb]">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className="border-t border-[#e5e7eb] pt-[17px]"
                      data-name="Container"
                      data-node-id="1:86"
                    >
                      <p
                        className="font-normal leading-[16px] text-[12px] text-[#64748b]"
                        data-node-id="1:88"
                      >
                        Select the bank template that matches your statement format for optimal parsing accuracy.
                      </p>
                      {isCustom && (
                        <p className="font-normal leading-[16px] text-[12px] text-[#dc2626] mt-[8px]">
                          Custom templates are not available yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-auto" data-name="Container" data-node-id="1:89">
                <div
                  className="bg-[#f9fafb] border-2 border-[#d1d5dc] rounded-[10px] h-[220px] sm:h-[320px] lg:h-[420px] xl:h-[600px] w-full xl:w-[300px] flex items-center justify-center"
                  data-name="Container"
                  data-node-id="1:90"
                >
                  <div className="h-[40px] w-[110.141px]" data-name="Container" data-node-id="1:91">
                    <div className="flex flex-col gap-[4px] items-center">
                      <p
                        className="font-medium leading-[20px] text-[14px] tracking-[-0.1504px] text-[#64748b]"
                        data-node-id="1:93"
                      >
                        Sponsored Tools
                      </p>
                      <p
                        className="font-normal leading-[16px] text-[12px] text-[#99a1af]"
                        data-node-id="1:95"
                      >
                        300x600
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-[44px] pb-[24px]">
        <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-[24px] py-[24px]">
          <h2 className="text-[22px] leading-[30px] font-semibold text-[#101828]">
            Bank Statement Converter for CSV, Excel, JSON, and QuickBooks
          </h2>
          <p className="mt-[10px] text-[15px] leading-[24px] text-[#4a5565]">
            SafeDataFlow helps individuals and small businesses convert bank statement PDFs into structured data for
            accounting and reconciliation workflows. Supported templates currently include CHASE, HSBC, and DEUTSCHE.
          </p>
          <p className="mt-[10px] text-[15px] leading-[24px] text-[#4a5565]">
            Review our <Link className="text-[#155dfc] underline" href="/privacy">Privacy Policy</Link>,{" "}
            <Link className="text-[#155dfc] underline" href="/terms">Terms of Service</Link>,{" "}
            <Link className="text-[#155dfc] underline" href="/contact">Contact</Link>, and{" "}
            <Link className="text-[#155dfc] underline" href="/api-docs">API Documentation</Link> for implementation
            details.
          </p>
        </div>
      </section>

      <footer
        className="bg-white border-t border-[#e5e7eb] min-h-[85px]"
        data-name="Footer"
        data-node-id="1:96"
      >
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-[44.5px] py-6 lg:pt-[33px]">
          <p
            className="text-center font-normal leading-[20px] text-[14px] tracking-[-0.1504px] text-[#64748b]"
            data-node-id="1:98"
          >
            &copy; 2026 SafeDataFlow. Files are processed for conversion and not stored in a database.
          </p>
        </div>
      </footer>
    </div>
  );
}
