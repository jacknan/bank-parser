package com.safedataflow.bank.parser;

import com.safedataflow.bank.dto.ReconciliationResult;
import com.safedataflow.bank.dto.StatementParseResult;
import com.safedataflow.bank.model.Transaction;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.text.PDFTextStripperByArea;

import java.awt.geom.Rectangle2D;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoField;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public abstract class BasePdfTemplateParser implements BankTemplateParser {

    private static final DateTimeFormatter MONTH_DAY_YEAR = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("MMM d")
            .parseDefaulting(ChronoField.YEAR, LocalDate.now().getYear())
            .toFormatter(Locale.ENGLISH);

    private static final DateTimeFormatter DAY_MONTH_YEAR = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("d MMM")
            .parseDefaulting(ChronoField.YEAR, LocalDate.now().getYear())
            .toFormatter(Locale.ENGLISH);
    private static final DateTimeFormatter MONTH_DAY_NUMERIC = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("M/d")
            .parseDefaulting(ChronoField.YEAR, LocalDate.now().getYear())
            .toFormatter(Locale.ENGLISH);

    private static final Pattern YEAR_PATTERN = Pattern.compile("\\b(20\\d{2})\\b");
    private static final Pattern LAST4_PATTERN = Pattern.compile("(?:ending|last\\s*4|acct\\s*#?|account)\\D*(\\d{4})", Pattern.CASE_INSENSITIVE);
    private static final Pattern OPENING_BALANCE_PATTERN = Pattern.compile("(?:opening|start)\\s+balance\\D*([-()0-9,\\.\\sA-Z]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern CLOSING_BALANCE_PATTERN = Pattern.compile("(?:closing|ending|end)\\s+balance\\D*([-()0-9,\\.\\sA-Z]+)", Pattern.CASE_INSENSITIVE);

    @Override
    public boolean supports(String bankType) {
        return bankType != null && getBankType().equalsIgnoreCase(bankType.trim());
    }

    @Override
    public StatementParseResult parse(InputStream pdfStream) throws IOException {
        try (PDDocument document = Loader.loadPDF(pdfStream.readAllBytes())) {
            if (document.getNumberOfPages() == 0) {
                throw new IllegalArgumentException("Empty PDF document");
            }

            PdfColumnRegions regions = getColumnRegions();
            String headerText = extractRegion(document.getPage(0), regions.header(), "header");
            Integer statementYear = parseYear(headerText);

            List<Transaction> transactions = extractTransactions(document, regions, statementYear);
            BigDecimal startBalance = parseBalance(headerText, OPENING_BALANCE_PATTERN);
            BigDecimal endBalance = parseBalance(headerText, CLOSING_BALANCE_PATTERN);

            if (endBalance == null && !transactions.isEmpty()) {
                endBalance = transactions.get(transactions.size() - 1).getBalance();
            }
            if (startBalance == null && !transactions.isEmpty()) {
                Transaction first = transactions.get(0);
                if (first.getBalance() != null && first.getAmount() != null) {
                    startBalance = first.getBalance().subtract(first.getAmount());
                }
            }

            ReconciliationResult reconciliation = reconcile(startBalance, endBalance, transactions);

            return StatementParseResult.builder()
                    .bankName(getBankName())
                    .accountLast4(parseLast4(headerText))
                    .statementYear(statementYear)
                    .startBalance(startBalance)
                    .endBalance(endBalance)
                    .transactions(transactions)
                    .reconciliation(reconciliation)
                    .build();
        }
    }

    protected abstract String getBankType();

    protected abstract String getBankName();

    protected abstract PdfColumnRegions getColumnRegions();

    private List<Transaction> extractTransactions(PDDocument document, PdfColumnRegions regions, Integer statementYear) throws IOException {
        List<Transaction> transactions = new ArrayList<>();
        Transaction current = null;

        for (int i = 0; i < document.getNumberOfPages(); i++) {
            PDPage page = document.getPage(i);

            List<String> dateLines = splitLines(extractRegion(page, regions.date(), "date"));
            List<String> descLines = splitLines(extractRegion(page, regions.description(), "description"));
            List<String> amountLines = splitLines(extractRegion(page, regions.amount(), "amount"));
            List<String> balanceLines = splitLines(extractRegion(page, regions.balance(), "balance"));

            int max = Math.max(Math.max(dateLines.size(), descLines.size()), Math.max(amountLines.size(), balanceLines.size()));

            for (int row = 0; row < max; row++) {
                String rawDate = safeLine(dateLines, row);
                String rawDesc = safeLine(descLines, row);
                String rawAmount = safeLine(amountLines, row);
                String rawBalance = safeLine(balanceLines, row);

                boolean hasDate = !rawDate.isBlank();
                boolean hasDesc = !rawDesc.isBlank();

                if (hasDate) {
                    if (current != null) {
                        transactions.add(current);
                    }
                    current = Transaction.builder()
                            .date(parseDate(rawDate, statementYear))
                            .description(rawDesc)
                            .amount(parseAmount(rawAmount))
                            .balance(parseAmount(rawBalance))
                            .build();
                    continue;
                }

                if (current != null && hasDesc) {
                    current.setDescription((current.getDescription() + " " + rawDesc).trim());
                }
                if (current != null && !rawAmount.isBlank()) {
                    current.setAmount(parseAmount(rawAmount));
                }
                if (current != null && !rawBalance.isBlank()) {
                    current.setBalance(parseAmount(rawBalance));
                }
            }
        }

        if (current != null) {
            transactions.add(current);
        }

        return transactions;
    }

    private ReconciliationResult reconcile(BigDecimal startBalance, BigDecimal endBalance, List<Transaction> transactions) {
        BigDecimal deposits = BigDecimal.ZERO;
        BigDecimal withdrawals = BigDecimal.ZERO;

        for (Transaction tx : transactions) {
            if (tx.getAmount() == null) {
                continue;
            }
            if (tx.getAmount().signum() >= 0) {
                deposits = deposits.add(tx.getAmount());
            } else {
                withdrawals = withdrawals.add(tx.getAmount().abs());
            }
        }

        if (startBalance == null || endBalance == null) {
            return ReconciliationResult.builder()
                    .balanced(false)
                    .deposits(deposits)
                    .withdrawals(withdrawals)
                    .expectedEndBalance(null)
                    .actualEndBalance(endBalance)
                    .message("Insufficient header balances for reconciliation")
                    .build();
        }

        BigDecimal expected = startBalance.add(deposits).subtract(withdrawals);
        boolean ok = expected.compareTo(endBalance) == 0;

        return ReconciliationResult.builder()
                .balanced(ok)
                .deposits(deposits)
                .withdrawals(withdrawals)
                .expectedEndBalance(expected)
                .actualEndBalance(endBalance)
                .message(ok ? "Reconciliation passed" : "Reconciliation failed: parsed values may be inaccurate")
                .build();
    }

    private String extractRegion(PDPage page, Rectangle2D region, String regionName) throws IOException {
        PDFTextStripperByArea stripper = new PDFTextStripperByArea();
        stripper.addRegion(regionName, region);
        stripper.extractRegions(page);
        return stripper.getTextForRegion(regionName);
    }

    private List<String> splitLines(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        String[] rows = text.replace("\r", "\n").split("\n");
        List<String> result = new ArrayList<>(rows.length);
        for (String row : rows) {
            result.add(row == null ? "" : row.trim());
        }
        return result;
    }

    private String safeLine(List<String> rows, int index) {
        if (index < 0 || index >= rows.size()) {
            return "";
        }
        return rows.get(index);
    }

    private Integer parseYear(String headerText) {
        Matcher matcher = YEAR_PATTERN.matcher(headerText == null ? "" : headerText);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return LocalDate.now().getYear();
    }

    private String parseLast4(String headerText) {
        Matcher matcher = LAST4_PATTERN.matcher(headerText == null ? "" : headerText);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private BigDecimal parseBalance(String headerText, Pattern pattern) {
        if (headerText == null) {
            return null;
        }

        String[] lines = headerText.replace("\r", "\n").split("\n");
        for (String line : lines) {
            Matcher matcher = pattern.matcher(line);
            if (matcher.find()) {
                BigDecimal value = parseAmount(matcher.group(1));
                if (value != null) {
                    return value;
                }
            }
        }
        return null;
    }

    private LocalDate parseDate(String rawDate, Integer statementYear) {
        if (rawDate == null || rawDate.isBlank()) {
            return null;
        }

        String cleaned = rawDate.replaceAll("[^A-Za-z0-9 /]", " ").replaceAll("\\s+", " ").trim();
        int year = statementYear == null ? LocalDate.now().getYear() : statementYear;

        try {
            LocalDate parsed = LocalDate.parse(cleaned, MONTH_DAY_YEAR);
            return parsed.withYear(year);
        } catch (DateTimeParseException ignore) {
        }

        try {
            LocalDate parsed = LocalDate.parse(cleaned, DAY_MONTH_YEAR);
            return parsed.withYear(year);
        } catch (DateTimeParseException ignore) {
        }

        try {
            LocalDate parsed = LocalDate.parse(cleaned, MONTH_DAY_NUMERIC);
            return parsed.withYear(year);
        } catch (DateTimeParseException ignore) {
        }

        return null;
    }

    private BigDecimal parseAmount(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        boolean negative = normalized.contains("DR") || normalized.startsWith("-")
                || (normalized.startsWith("(") && normalized.endsWith(")"));

        normalized = normalized
                .replace("DR", "")
                .replace("CR", "")
                .replace("$", "")
                .replace(",", "")
                .replace("(", "")
                .replace(")", "")
                .replaceAll("[^0-9.\\-]", "")
                .trim();

        if (normalized.isBlank() || normalized.equals("-")) {
            return null;
        }

        BigDecimal value = new BigDecimal(normalized);
        return negative ? value.abs().negate() : value;
    }
}
