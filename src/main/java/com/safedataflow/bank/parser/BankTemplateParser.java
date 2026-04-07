package com.safedataflow.bank.parser;

import com.safedataflow.bank.dto.StatementParseResult;

import java.io.IOException;
import java.io.InputStream;

public interface BankTemplateParser {
    boolean supports(String bankType);

    StatementParseResult parse(InputStream pdfStream) throws IOException;
}
