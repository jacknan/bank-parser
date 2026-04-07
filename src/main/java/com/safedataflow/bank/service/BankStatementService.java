package com.safedataflow.bank.service;

import com.safedataflow.bank.dto.StatementParseResult;

import java.io.InputStream;

public interface BankStatementService {
    StatementParseResult parse(InputStream pdfStream, String bankType);
}
