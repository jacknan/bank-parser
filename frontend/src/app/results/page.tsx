"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
const imgDepositVector = "/figma/results/deposit-vector.svg";
const imgDepositVector1 = "/figma/results/deposit-vector-1.svg";
const imgWithdrawVector = "/figma/results/withdraw-vector.svg";
const imgWithdrawVector1 = "/figma/results/withdraw-vector-1.svg";
const imgNetVector = "/figma/results/net-vector.svg";
const imgNetVector1 = "/figma/results/net-vector-1.svg";
const imgSuccessIcon = "/figma/results/success-icon.svg";
const imgCloseIcon = "/figma/results/close-icon.svg";
const imgSecureIcon = "/figma/results/secure-icon.svg";
const imgCopyIcon = "/figma/results/copy-icon.svg";
const imgQuickbooksIcon = "/figma/results/quickbooks-icon.svg";
const imgDownloadIcon = "/figma/results/download-icon.svg";
const imgDownloadChevron = "/figma/results/download-chevron.svg";
const imgRestartIcon = "/figma/results/restart-icon.svg";
const RESULT_STORAGE_KEY = "bank-parse-result";
const RESULT_BACKUP_STORAGE_KEY = "bank-parse-result-backup";

type Transaction = {
  date?: string;
  description?: string;
  amount?: number | string;
  balance?: number | string;
};

type Reconciliation = {
  balanced?: boolean;
  deposits?: number | string;
  withdrawals?: number | string;
  expectedEndBalance?: number | string;
  actualEndBalance?: number | string;
  message?: string;
};

type StatementParseResult = {
  bankName?: string;
  accountLast4?: string;
  statementYear?: number;
  startBalance?: number | string;
  endBalance?: number | string;
  transactions?: Transaction[];
  reconciliation?: Reconciliation;
};

type ConvertResponse = {
  bankType?: string;
  preview?: StatementParseResult;
};

type ExportRow = {
  date: string;
  sourceDate?: string;
  description: string;
  category: string;
  amount: number;
  balance: number | null;
};

const parseNumber = (value?: number | string) => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const escapeCsvField = (value: string | number) => {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const sanitizeIifText = (value: string) => value.replace(/[\t\r\n]/g, " ").trim();

const formatQuickBooksDate = (value?: string) => {
  if (!value || value === "--") {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = String(now.getFullYear());
    return `${month}/${day}/${year}`;
  }

  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    return `${isoDateMatch[2]}/${isoDateMatch[3]}/${isoDateMatch[1]}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    const year = String(parsed.getFullYear());
    return `${month}/${day}/${year}`;
  }

  return value;
};

const downloadBlob = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
  return formatter.format(value);
};

const formatDate = (value?: string) => {
  if (!value) {
    return "--";
  }
  const parts = value.split("-");
  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    const date = new Date(year, month, day);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }
  return value;
};

export default function ResultsPage() {
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [bannerVisible, setBannerVisible] = useState(true);
  const downloadRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const parseStored = (value: string | null) => {
      if (!value) {
        return null;
      }
      try {
        return JSON.parse(value) as ConvertResponse;
      } catch {
        return null;
      }
    };

    const sessionStored = sessionStorage.getItem(RESULT_STORAGE_KEY);
    const parsedSession = parseStored(sessionStored);
    if (parsedSession) {
      setResult(parsedSession);
      setStorageLoaded(true);
      return;
    }

    const backupStored = localStorage.getItem(RESULT_BACKUP_STORAGE_KEY);
    const parsedBackup = parseStored(backupStored);
    if (parsedBackup) {
      setResult(parsedBackup);
      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(parsedBackup));
    }
    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!result) {
      return;
    }
    const serialized = JSON.stringify(result);
    sessionStorage.setItem(RESULT_STORAGE_KEY, serialized);
    localStorage.setItem(RESULT_BACKUP_STORAGE_KEY, serialized);
  }, [result]);

  useEffect(() => {
    if (!downloadOpen) {
      return;
    }
    const handleOutside = (event: MouseEvent) => {
      if (!downloadRef.current?.contains(event.target as Node)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [downloadOpen]);

  useEffect(() => {
    if (copyState !== "copied") {
      return;
    }
    const timeout = window.setTimeout(() => setCopyState("idle"), 1600);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const preview = result?.preview;
  const reconciliation = preview?.reconciliation;

  const transactions = useMemo(() => preview?.transactions ?? [], [preview?.transactions]);
  const hasData = transactions.length > 0;
  const computedDeposits = useMemo(
    () =>
      transactions.reduce((sum, item) => {
        const amount = parseNumber(item.amount);
        return amount > 0 ? sum + amount : sum;
      }, 0),
    [transactions]
  );
  const computedWithdrawals = useMemo(
    () =>
      transactions.reduce((sum, item) => {
        const amount = parseNumber(item.amount);
        return amount < 0 ? sum + Math.abs(amount) : sum;
      }, 0),
    [transactions]
  );

  const hasDepositValue = reconciliation?.deposits !== undefined && reconciliation?.deposits !== null;
  const hasWithdrawalValue = reconciliation?.withdrawals !== undefined && reconciliation?.withdrawals !== null;

  const totalDeposits = hasDepositValue ? parseNumber(reconciliation?.deposits) : computedDeposits;
  const totalWithdrawals = hasWithdrawalValue ? parseNumber(reconciliation?.withdrawals) : computedWithdrawals;

  const netChange = useMemo(() => {
    if (totalDeposits || totalWithdrawals) {
      return totalDeposits - totalWithdrawals;
    }
    const startBalance = parseNumber(preview?.startBalance);
    const endBalance = parseNumber(preview?.endBalance);
    if (startBalance || endBalance) {
      return endBalance - startBalance;
    }
    return transactions.reduce((sum, item) => sum + parseNumber(item.amount), 0);
  }, [preview?.endBalance, preview?.startBalance, totalDeposits, totalWithdrawals, transactions]);

  const netChangeColor = netChange >= 0 ? "text-[#00a63e]" : "text-[#e7000b]";
  const netChangeLabel = `${netChange >= 0 ? "+" : "-"}${formatCurrency(Math.abs(netChange))}`;

  const rows = useMemo(() => {
    return transactions.map((item, index) => {
      const amount = parseNumber(item.amount);
      const amountLabel =
        amount > 0 ? `+${formatCurrency(amount)}` : amount < 0 ? formatCurrency(Math.abs(amount)) : "$0.00";
      const amountColor =
        amount > 0 ? "text-[#00a63e]" : amount < 0 ? "text-[#e7000b]" : "text-[#101828]";
      return {
        date: formatDate(item.date),
        description: item.description || "--",
        category: "Uncategorized",
        amount: amountLabel,
        amountColor,
        balance: item.balance !== undefined ? formatCurrency(parseNumber(item.balance)) : "--",
        highlight: index === 0,
      };
    });
  }, [transactions]);

  const exportRows = useMemo<ExportRow[]>(() => {
    return transactions.map((item) => ({
        date: formatDate(item.date),
        sourceDate: item.date,
        description: item.description || "--",
        category: "Uncategorized",
        amount: parseNumber(item.amount),
        balance:
          item.balance === undefined || item.balance === null ? null : parseNumber(item.balance),
      }));
  }, [transactions]);

  const csvContent = useMemo(() => {
    const header = "Date,Description,Category,Amount,Balance";
    const lines = exportRows.map((row) =>
      [
        escapeCsvField(row.date),
        escapeCsvField(row.description),
        escapeCsvField(row.category),
        escapeCsvField(row.amount.toFixed(2)),
        escapeCsvField(row.balance === null ? "" : row.balance.toFixed(2)),
      ].join(",")
    );
    return [header, ...lines].join("\n");
  }, [exportRows]);

  const jsonContent = useMemo(
    () =>
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          bankType: result?.bankType ?? null,
          preview: result?.preview ?? null,
          transactions: exportRows,
        },
        null,
        2
      ),
    [exportRows, result?.bankType, result?.preview]
  );

  const excelContent = useMemo(() => {
    const headerRow = `
        <Row>
          <Cell><Data ss:Type="String">Date</Data></Cell>
          <Cell><Data ss:Type="String">Description</Data></Cell>
          <Cell><Data ss:Type="String">Category</Data></Cell>
          <Cell><Data ss:Type="String">Amount</Data></Cell>
          <Cell><Data ss:Type="String">Balance</Data></Cell>
        </Row>`;

    const dataRows = exportRows
      .map((row) => {
        const balanceCell =
          row.balance === null
            ? `<Cell><Data ss:Type="String"></Data></Cell>`
            : `<Cell><Data ss:Type="Number">${row.balance.toFixed(2)}</Data></Cell>`;

        return `
        <Row>
          <Cell><Data ss:Type="String">${escapeXml(row.date)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(row.description)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(row.category)}</Data></Cell>
          <Cell><Data ss:Type="Number">${row.amount.toFixed(2)}</Data></Cell>
          ${balanceCell}
        </Row>`;
      })
      .join("");

    return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Transactions">
    <Table>${headerRow}${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
  }, [exportRows]);

  const quickBooksIifContent = useMemo(() => {
    const bankAccount = sanitizeIifText(
      preview?.bankName ? `${preview.bankName} Checking` : "Bank Account"
    );
    const lines = [
      "!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO",
      "!SPL\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO",
      "!ENDTRNS",
    ];

    exportRows
      .filter((row) => Math.abs(row.amount) > 0.000001)
      .forEach((row) => {
        const transactionType = row.amount >= 0 ? "DEPOSIT" : "CHECK";
        const transactionDate = formatQuickBooksDate(row.sourceDate ?? row.date);
        const amount = Number(row.amount.toFixed(2));
        const memo = sanitizeIifText(row.description || row.category || "Bank Transaction");
        const counterparty = memo;
        const offsetAccount =
          row.amount >= 0 ? "Income:Uncategorized" : "Expenses:Uncategorized";

        lines.push(
          `TRNS\t${transactionType}\t${transactionDate}\t${bankAccount}\t${counterparty}\t${amount.toFixed(2)}\t${memo}`
        );
        lines.push(
          `SPL\t${transactionType}\t${transactionDate}\t${offsetAccount}\t${counterparty}\t${(-amount).toFixed(2)}\t${memo}`
        );
        lines.push("ENDTRNS");
      });

    return `${lines.join("\n")}\n`;
  }, [exportRows, preview?.bankName]);

  const handleDownload = (format: "csv" | "excel" | "json") => {
    if (format === "csv") {
      downloadBlob("transactions.csv", csvContent, "text/csv;charset=utf-8");
    } else if (format === "excel") {
      downloadBlob("transactions.xls", excelContent, "application/vnd.ms-excel");
    } else {
      downloadBlob("transactions.json", jsonContent, "application/json;charset=utf-8");
    }
    setDownloadOpen(false);
  };

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      setCopyState("error");
      return;
    }
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  const handleQuickBooksExport = () => {
    downloadBlob("quickbooks-import.iif", quickBooksIifContent, "text/plain;charset=utf-8");
  };

  const handleStartNewUpload = () => {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
    localStorage.removeItem(RESULT_BACKUP_STORAGE_KEY);
    router.push("/");
  };

  const copyLabel =
    copyState === "copied" ? "Copied" : copyState === "error" ? "Copy Failed" : "Copy to Clipboard";

  const reconciliationText =
    reconciliation?.message ||
    "Reconciliation Success! Initial Balance + Deposits - Withdrawals = Ending Balance.";

  if (!storageLoaded) {
    return (
      <div className="bg-[#fafafa] min-h-screen font-results">
        <div className="w-full max-w-[1232px] px-4 sm:px-6 mx-auto pt-[40px] sm:pt-[64px]">
          <p className="text-[30px] leading-[36px] text-[#101828]">SafeDataFlow</p>
          <p className="mt-[8px] text-[16px] leading-[24px] text-[#4a5565]">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-[#fafafa] min-h-screen font-results">
        <div className="w-full max-w-[1232px] px-4 sm:px-6 mx-auto pt-[40px] sm:pt-[64px] pb-[64px]">
          <p className="text-[30px] leading-[36px] text-[#101828]">SafeDataFlow</p>
          <p className="mt-[8px] text-[16px] leading-[24px] text-[#4a5565]">
            Bank Statement Analysis Results
          </p>
          <div className="mt-[24px] sm:mt-[32px] bg-white border border-[#e5e7eb] rounded-[14px] px-4 sm:px-[32px] py-8 sm:py-[40px] text-center">
            <p className="text-[24px] leading-[32px] text-[#101828]">No parsed data available</p>
            <p className="mt-[12px] text-[14px] leading-[20px] text-[#6a7282]">
              Upload a bank statement PDF to view transactions and export files.
            </p>
            <button
              type="button"
              className="mt-[24px] h-[40px] px-[18px] rounded-[10px] bg-[#155dfc] text-white text-[14px] leading-[20px]"
              onClick={handleStartNewUpload}
            >
              Start New Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] min-h-screen font-results" data-name="Results" data-node-id="3:4">
      <div className="relative w-full max-w-[1305px] mx-auto px-4 sm:px-6 pt-6 sm:pt-[32px] pb-[120px] lg:pb-[40px]">
        <div className="flex flex-col gap-[8px] w-full max-w-[1232px] mx-auto" data-name="Container" data-node-id="3:5">
          <div className="h-[36px]" data-name="Heading 1" data-node-id="3:6">
            <p
              className="font-normal leading-[36px] text-[30px] text-[#101828]"
              data-node-id="3:7"
            >
              SafeDataFlow
            </p>
          </div>
          <div className="h-[24px]" data-name="Paragraph" data-node-id="3:8">
            <p
              className="font-normal leading-[24px] text-[16px] text-[#4a5565]"
              data-node-id="3:9"
            >
              Bank Statement Analysis Results
            </p>
          </div>
        </div>

        {bannerVisible && (
          <div
            className="bg-[#f0fdf4] border border-[#b9f8cf] rounded-[10px] w-full max-w-[1232px] mx-auto mt-5 sm:mt-[32px] px-4 sm:px-[21px] py-3 sm:pt-[17px]"
            data-name="Container"
            data-node-id="3:256"
          >
            <div className="flex items-start sm:items-center justify-between gap-2 sm:h-[28px]" data-name="Container" data-node-id="3:257">
              <div className="flex items-start sm:items-center gap-[12px]" data-name="Container" data-node-id="3:258">
                <div className="size-[20px]" data-name="Icon" data-node-id="3:259">
                  <img alt="" className="block size-full" src={imgSuccessIcon} />
                </div>
                <p
                  className="font-normal leading-[22px] text-[14px] sm:text-[16px] text-[#0d542b]"
                  data-node-id="3:263"
                >
                  {reconciliationText}
                </p>
              </div>
              <button
                type="button"
                className="size-[28px] rounded-full"
                data-name="Button"
                data-node-id="3:264"
                onClick={() => setBannerVisible(false)}
              >
                <img alt="" className="block size-[16px] mx-auto" src={imgCloseIcon} />
              </button>
            </div>
          </div>
        )}

        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[16px] w-full max-w-[1232px] mx-auto mt-[24px]"
          data-name="Container"
          data-node-id="3:10"
        >
          <div
            className="bg-white border border-[#e5e7eb] rounded-[10px] pt-[21px] pb-px px-[21px] flex flex-col gap-[8px]"
            data-name="Container"
            data-node-id="3:11"
          >
            <div className="flex items-center justify-between h-[32px]" data-name="Container" data-node-id="3:12">
              <p className="font-normal leading-[20px] text-[14px] text-[#4a5565]" data-node-id="3:14">
                Total Deposits
              </p>
              <div className="bg-[#f0fdf4] rounded-[10px] size-[32px]" data-name="Container" data-node-id="3:15">
                <div className="pt-[8px] px-[8px]">
                  <div className="h-[16px] overflow-clip relative" data-name="Icon" data-node-id="3:16">
                    <div className="absolute inset-[29.17%_8.33%_45.83%_66.67%]" data-name="Vector" data-node-id="3:17">
                      <img alt="" className="block max-w-none size-full" src={imgDepositVector} />
                    </div>
                    <div className="absolute inset-[29.17%_8.33%]" data-name="Vector" data-node-id="3:18">
                      <img alt="" className="block max-w-none size-full" src={imgDepositVector1} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="font-normal leading-[32px] text-[24px] text-[#101828]" data-node-id="3:20">
              {formatCurrency(totalDeposits)}
            </p>
            <p className="font-normal leading-[16px] text-[12px] text-[#6a7282]" data-node-id="3:22">
              Sum of all credits
            </p>
          </div>

          <div
            className="bg-white border border-[#e5e7eb] rounded-[10px] pt-[21px] pb-px px-[21px] flex flex-col gap-[8px]"
            data-name="Container"
            data-node-id="3:23"
          >
            <div className="flex items-center justify-between h-[32px]" data-name="Container" data-node-id="3:24">
              <p className="font-normal leading-[20px] text-[14px] text-[#4a5565]" data-node-id="3:26">
                Total Withdrawals
              </p>
              <div className="bg-[#fef2f2] rounded-[10px] size-[32px]" data-name="Container" data-node-id="3:27">
                <div className="pt-[8px] px-[8px]">
                  <div className="h-[16px] overflow-clip relative" data-name="Icon" data-node-id="3:28">
                    <div className="absolute inset-[45.83%_8.33%_29.17%_66.67%]" data-name="Vector" data-node-id="3:29">
                      <img alt="" className="block max-w-none size-full" src={imgWithdrawVector} />
                    </div>
                    <div className="absolute inset-[29.17%_8.33%]" data-name="Vector" data-node-id="3:30">
                      <img alt="" className="block max-w-none size-full" src={imgWithdrawVector1} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="font-normal leading-[32px] text-[24px] text-[#101828]" data-node-id="3:32">
              {formatCurrency(totalWithdrawals)}
            </p>
            <p className="font-normal leading-[16px] text-[12px] text-[#6a7282]" data-node-id="3:34">
              Sum of all debits
            </p>
          </div>

          <div
            className="bg-white border border-[#e5e7eb] rounded-[10px] pt-[21px] pb-px px-[21px] flex flex-col gap-[8px]"
            data-name="Container"
            data-node-id="3:35"
          >
            <div className="flex items-center justify-between h-[32px]" data-name="Container" data-node-id="3:36">
              <p className="font-normal leading-[20px] text-[14px] text-[#4a5565]" data-node-id="3:38">
                Net Change
              </p>
              <div className="bg-[#eff6ff] rounded-[10px] size-[32px]" data-name="Container" data-node-id="3:39">
                <div className="pt-[8px] px-[8px]">
                  <div className="h-[16px] overflow-clip relative" data-name="Icon" data-node-id="3:40">
                    <div className="absolute bottom-[8.33%] left-1/2 right-1/2 top-[8.33%]" data-name="Vector" data-node-id="3:41">
                      <img alt="" className="block max-w-none size-full" src={imgNetVector} />
                    </div>
                    <div className="absolute bottom-[20.83%] left-1/4 right-1/4 top-[20.83%]" data-name="Vector" data-node-id="3:42">
                      <img alt="" className="block max-w-none size-full" src={imgNetVector1} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className={`font-normal leading-[32px] text-[24px] ${netChangeColor}`} data-node-id="3:44">
              {netChangeLabel}
            </p>
            <p className="font-normal leading-[16px] text-[12px] text-[#6a7282]" data-node-id="3:46">
              The difference
            </p>
          </div>
        </div>

        <div
          className="md:hidden w-full max-w-[1232px] mx-auto mt-[24px] space-y-3"
          data-name="Container"
          data-node-id="3:47-mobile"
        >
          {rows.map((row, index) => (
            <article
              key={`${row.date}-${row.description}-${index}`}
              className={`rounded-[10px] border ${
                row.highlight ? "border-[#bfdbfe] bg-[rgba(239,246,255,0.35)]" : "border-[#e5e7eb] bg-white"
              } px-4 py-3`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium leading-[20px] text-[14px] text-[#101828]">{row.date}</p>
                <p className={`font-semibold leading-[20px] text-[14px] ${row.amountColor}`}>{row.amount}</p>
              </div>
              <p className="mt-2 font-normal leading-[20px] text-[14px] text-[#101828] break-words">
                {row.description}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="bg-[#f3e8ff] rounded-full px-[10px] py-[2px]">
                  <p className="font-normal leading-[16px] text-[12px] text-[#6e11b0] whitespace-nowrap">
                    {row.category}
                  </p>
                </div>
                <p className="font-normal leading-[16px] text-[12px] text-[#4a5565]">
                  Balance: <span className="text-[#101828]">{row.balance}</span>
                </p>
              </div>
            </article>
          ))}
        </div>

        <div
          className="hidden md:block bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] w-full max-w-[1232px] mx-auto mt-[24px] p-px overflow-x-auto"
          data-name="Container"
          data-node-id="3:47"
        >
          <div className="min-w-[1230px]">
            <div
              className="grid grid-cols-[171.906px_392.664px_317.5px_200.891px_147.039px] h-[40.5px] bg-[#f9fafb] border-b border-[#e5e7eb]"
              data-name="Table Header"
              data-node-id="3:49"
            >
              <div className="flex items-center pl-[16px]">
                <p className="font-normal leading-[16px] text-[12px] tracking-[0.6px] uppercase text-[#364153]">
                  Date
                </p>
              </div>
              <div className="flex items-center pl-[16px]">
                <p className="font-normal leading-[16px] text-[12px] tracking-[0.6px] uppercase text-[#364153]">
                  Description
                </p>
              </div>
              <div className="flex items-center pl-[16px]">
                <p className="font-normal leading-[16px] text-[12px] tracking-[0.6px] uppercase text-[#364153]">
                  Category (AI Suggested)
                </p>
              </div>
              <div className="flex items-center justify-end pr-[28px]">
                <p className="font-normal leading-[16px] text-[12px] tracking-[0.6px] uppercase text-[#364153]">
                  Amount
                </p>
              </div>
              <div className="flex items-center justify-end pr-[16px]">
                <p className="font-normal leading-[16px] text-[12px] tracking-[0.6px] uppercase text-[#364153]">
                  Balance
                </p>
              </div>
            </div>
            {rows.map((row, index) => {
              const isLast = index === rows.length - 1;
              return (
              <div
                key={`${row.date}-${row.description}-${index}`}
                className={`grid grid-cols-[171.906px_392.664px_317.5px_200.891px_147.039px] ${
                  isLast ? "h-[44.5px]" : "h-[45px]"
                } ${isLast ? "" : "border-b border-[#f3f4f6]"} ${
                  row.highlight ? "bg-[rgba(239,246,255,0.3)]" : "bg-white"
                }`}
                data-name="Table Row"
              >
                <div className="flex items-center pl-[16px]">
                  <p className="font-normal leading-[20px] text-[14px] text-[#101828]">{row.date}</p>
                </div>
                <div className="flex items-center pl-[16px] pr-[28px]">
                  <p className="font-normal leading-[20px] text-[14px] text-[#101828]">{row.description}</p>
                </div>
                <div className="flex items-center pl-[16px]">
                  <div className="bg-[#f3e8ff] rounded-full px-[10px] py-[2px]">
                    <p className="font-normal leading-[16px] text-[12px] text-[#6e11b0] whitespace-nowrap">
                      {row.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end pr-[28px]">
                  <p className={`font-normal leading-[20px] text-[14px] ${row.amountColor}`}>{row.amount}</p>
                </div>
                <div className="flex items-center justify-end pr-[16px]">
                  <p className="font-normal leading-[20px] text-[14px] text-[#101828]">{row.balance}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div
          className="w-full max-w-[1232px] mx-auto mt-[24px] flex items-center justify-center"
          data-name="Container"
          data-node-id="3:249"
        >
          <div
            className="bg-gradient-to-r from-[#f3f4f6] to-[#f9fafb] border border-[#e5e7eb] rounded-[10px] h-[90px] w-full max-w-[728px] flex items-center justify-center"
            data-name="Container"
            data-node-id="3:250"
          >
            <div className="flex flex-col gap-[4px] items-center">
              <p className="font-normal leading-[20px] text-[14px] text-[#6a7282]">Advertisement</p>
              <p className="font-normal leading-[16px] text-[12px] text-[#99a1af]">728 x 90 Banner Placement</p>
            </div>
          </div>
        </div>

        <div
          className="w-full max-w-[1232px] mx-auto mt-[24px] lg:fixed lg:left-1/2 lg:bottom-[24px] lg:-translate-x-1/2 lg:z-20 lg:mt-0"
          data-name="Container"
          data-node-id="3:269"
        >
          <div className="bg-white border-t border-[#e5e7eb] rounded-[10px] lg:rounded-tl-[10px] lg:rounded-tr-[10px] shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] px-4 sm:px-[24px] py-3 sm:pt-[17px]">
            <div className="flex items-center gap-[8px]" data-name="Container" data-node-id="3:271">
              <div className="size-[16px]" data-name="Icon" data-node-id="3:272">
                <img alt="" className="block size-full" src={imgSecureIcon} />
              </div>
              <p className="font-normal leading-[16px] text-[12px] text-[#4a5565]" data-node-id="3:276">
                Secure &amp; Encrypted
              </p>
            </div>

            <div
              className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-[10px] mt-3"
              data-name="Container"
              data-node-id="3:277"
            >
              <button
                type="button"
                className="bg-white border border-[#d1d5dc] rounded-[10px] h-[38px] px-3 flex items-center justify-center gap-2 sm:min-w-[177px]"
                data-name="Button"
                data-node-id="3:278"
                onClick={handleCopy}
              >
                <img alt="" className="block size-[16px]" src={imgCopyIcon} />
                <span className="font-normal leading-[20px] text-[14px] text-[#364153] whitespace-nowrap">
                  {copyLabel}
                </span>
              </button>

              <button
                type="button"
                className="bg-white border border-[#d1d5dc] rounded-[10px] h-[38px] px-3 flex items-center justify-center gap-2 sm:flex-1"
                data-name="Button"
                data-node-id="3:283"
                onClick={handleQuickBooksExport}
              >
                <img alt="" className="block size-[16px]" src={imgQuickbooksIcon} />
                <span className="font-normal leading-[20px] text-[14px] text-[#364153] whitespace-nowrap">
                  Export to QuickBooks
                </span>
              </button>

              <div
                ref={downloadRef}
                className="bg-[#155dfc] rounded-[10px] h-[38px] sm:h-[36px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] relative sm:w-[155px]"
                data-name="Button"
                data-node-id="3:291"
              >
                <button
                  type="button"
                  className="h-full w-full rounded-[10px] px-[14px] sm:px-[20px] flex items-center justify-between"
                  onClick={() => setDownloadOpen((open) => !open)}
                >
                  <span className="flex items-center gap-[8px] pointer-events-none">
                    <img alt="" className="block size-[16px]" src={imgDownloadIcon} />
                    <span className="font-normal leading-[20px] text-[14px] text-white whitespace-nowrap">
                      Download
                    </span>
                  </span>
                  <img
                    alt=""
                    className={`block size-[16px] transition-transform pointer-events-none ${downloadOpen ? "rotate-180" : ""}`}
                    src={imgDownloadChevron}
                  />
                  <span className="sr-only">Download options</span>
                </button>

                {downloadOpen && (
                  <div className="absolute right-0 bottom-[44px] w-[220px] bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_10px_15px_rgba(15,23,42,0.12)] overflow-hidden">
                    {[
                      { label: "Export to CSV", format: "csv" as const },
                      { label: "Export to Excel", format: "excel" as const },
                      { label: "Export to JSON", format: "json" as const },
                    ].map((item, index) => (
                      <button
                        key={item.label}
                        type="button"
                        className={`w-full h-[48px] px-[16px] flex items-center gap-[12px] text-left font-normal text-[16px] leading-[24px] text-[#364153] ${
                          index !== 0 ? "border-t border-[#f1f5f9]" : ""
                        }`}
                        onClick={() => handleDownload(item.format)}
                      >
                        <img alt="" className="size-[18px]" src={imgQuickbooksIcon} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="bg-white border border-[#d1d5dc] rounded-[10px] h-[38px] px-3 flex items-center justify-center gap-2 sm:min-w-[172px]"
                data-name="Button"
                data-node-id="3:300"
                onClick={handleStartNewUpload}
              >
                <img alt="" className="block size-[16px]" src={imgRestartIcon} />
                <span className="font-normal leading-[20px] text-[14px] text-[#364153] whitespace-nowrap">
                  Start New Upload
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
