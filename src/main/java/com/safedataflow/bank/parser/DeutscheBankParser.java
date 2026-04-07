package com.safedataflow.bank.parser;

import org.springframework.stereotype.Component;

import java.awt.geom.Rectangle2D;

@Component
public class DeutscheBankParser extends BasePdfTemplateParser {

    @Override
    protected String getBankType() {
        return "DEUTSCHE";
    }

    @Override
    protected String getBankName() {
        return "Deutsche Bank";
    }

    @Override
    protected PdfColumnRegions getColumnRegions() {
        return new PdfColumnRegions(
                new Rectangle2D.Float(15, 20, 570, 150),
                new Rectangle2D.Float(15, 180, 80, 580),
                new Rectangle2D.Float(95, 180, 305, 580),
                new Rectangle2D.Float(400, 180, 85, 580),
                new Rectangle2D.Float(485, 180, 100, 580)
        );
    }
}
