package com.safedataflow.bank.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {
    private LocalDate date;
    private String description;
    private BigDecimal amount;
    private BigDecimal balance;
}
