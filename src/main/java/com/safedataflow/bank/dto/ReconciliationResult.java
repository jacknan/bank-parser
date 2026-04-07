package com.safedataflow.bank.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationResult {
    private boolean balanced;
    private BigDecimal deposits;
    private BigDecimal withdrawals;
    private BigDecimal expectedEndBalance;
    private BigDecimal actualEndBalance;
    private String message;
}
