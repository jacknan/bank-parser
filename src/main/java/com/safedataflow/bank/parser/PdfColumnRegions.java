package com.safedataflow.bank.parser;

import java.awt.geom.Rectangle2D;

public record PdfColumnRegions(
        Rectangle2D header,
        Rectangle2D date,
        Rectangle2D description,
        Rectangle2D amount,
        Rectangle2D balance
) {
}
