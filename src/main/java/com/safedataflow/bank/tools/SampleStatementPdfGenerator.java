package com.safedataflow.bank.tools;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import java.io.IOException;
import java.nio.file.Path;

public class SampleStatementPdfGenerator {

    public static void main(String[] args) throws IOException {
        String output = args.length > 0 ? args[0] : "sample/generated_statement.pdf";
        Path outputPath = Path.of(output);
        if (outputPath.getParent() != null) {
            java.nio.file.Files.createDirectories(outputPath.getParent());
        }

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);

            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                draw(cs, font, 12, 30, 760, "Statement Period: Jan 01, 2026 - Jan 31, 2026");
                draw(cs, font, 10, 30, 742, "Bank: Demo Chase Account ending 1234");
                draw(cs, font, 10, 30, 724, "Opening Balance 745.99");
                draw(cs, font, 10, 30, 708, "Ending Balance 1400.00");

                draw(cs, font, 11, 25, 620, "01/05");
                draw(cs, font, 11, 100, 620, "AMAZON.COM*MARKETPLACE");
                draw(cs, font, 11, 390, 620, "-45.99");
                draw(cs, font, 11, 490, 620, "700.00");

                draw(cs, font, 11, 25, 600, "01/10");
                draw(cs, font, 11, 100, 600, "REMITLY TRANSFER IN");
                draw(cs, font, 11, 390, 600, "+500.00");
                draw(cs, font, 11, 490, 600, "1200.00");

                draw(cs, font, 11, 25, 580, "01/12");
                draw(cs, font, 11, 100, 580, "STRIPE SETTLEMENT FROM");
                draw(cs, font, 11, 390, 580, "+200.00");
                draw(cs, font, 11, 490, 580, "1400.00");

                draw(cs, font, 11, 100, 560, "CLIENT A");
            }

            document.save(outputPath.toFile());
        }

        System.out.println("Generated sample PDF at: " + outputPath.toAbsolutePath());
    }

    private static void draw(PDPageContentStream cs, PDType1Font font, int size, float x, float y, String text) throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }
}
