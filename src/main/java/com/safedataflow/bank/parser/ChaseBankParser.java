package com.safedataflow.bank.parser;

import org.springframework.stereotype.Component;

import java.awt.geom.Rectangle2D;

@Component
public class ChaseBankParser extends BasePdfTemplateParser {

    @Override
    protected String getBankType() {
        return "CHASE";
    }

    @Override
    protected String getBankName() {
        return "Chase Bank";
    }

    @Override
    protected PdfColumnRegions getColumnRegions() {
        return new PdfColumnRegions(
                new Rectangle2D.Float(20, 20, 560, 140),
                new Rectangle2D.Float(20, 170, 75, 590),
                new Rectangle2D.Float(95, 170, 290, 590),
                new Rectangle2D.Float(385, 170, 95, 590),
                new Rectangle2D.Float(480, 170, 100, 590)
        );
    }
}
