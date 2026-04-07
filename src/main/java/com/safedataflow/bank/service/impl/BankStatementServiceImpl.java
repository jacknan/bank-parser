package com.safedataflow.bank.service.impl;

import com.safedataflow.bank.dto.StatementParseResult;
import com.safedataflow.bank.parser.BankTemplateParser;
import com.safedataflow.bank.service.BankStatementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BankStatementServiceImpl implements BankStatementService {

    private final List<BankTemplateParser> parsers;

    @Override
    public StatementParseResult parse(InputStream pdfStream, String bankType) {
        return parsers.stream()
                .filter(parser -> parser.supports(bankType))
                .findFirst()
                .map(parser -> {
                    try {
                        return parser.parse(pdfStream);
                    } catch (Exception e) {
                        throw new IllegalStateException("Failed to parse statement: " + e.getMessage(), e);
                    }
                })
                .orElseThrow(() -> new IllegalArgumentException("Unsupported bankType: " + bankType));
    }
}
