package com.safedataflow.bank.parser;

import org.springframework.stereotype.Component;

import java.awt.geom.Rectangle2D;

@Component
public class HsbcParser extends BasePdfTemplateParser {

    @Override
    protected String getBankType() {
        return "HSBC";
    }

    @Override
    protected String getBankName() {
        return "HSBC";
    }

    @Override
    protected PdfColumnRegions getColumnRegions() {
        return new PdfColumnRegions(
                new Rectangle2D.Float(18, 18, 565, 150),
                new Rectangle2D.Float(18, 175, 78, 585),
                new Rectangle2D.Float(96, 175, 300, 585),
                new Rectangle2D.Float(396, 175, 90, 585),
                new Rectangle2D.Float(486, 175, 97, 585)
        );
    }
}
