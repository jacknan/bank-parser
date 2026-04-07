package com.safedataflow.bank.dto;

import com.safedataflow.bank.model.Transaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatementParseResult {
    private String bankName;
    private String accountLast4;
    private Integer statementYear;
    private BigDecimal startBalance;
    private BigDecimal endBalance;

    @Builder.Default
    private List<Transaction> transactions = new ArrayList<>();

    private ReconciliationResult reconciliation;
}
