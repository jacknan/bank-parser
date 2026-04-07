package com.safedataflow.bank.api;

import com.safedataflow.bank.dto.ConvertResponse;
import com.safedataflow.bank.service.BankStatementService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ConvertController {

    private final BankStatementService bankStatementService;

    @PostMapping(value = "/convert", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ConvertResponse convert(
            @RequestParam("file") MultipartFile file,
            @RequestParam("bankType") @NotBlank String bankType
    ) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        return ConvertResponse.builder()
                .bankType(bankType)
                .preview(bankStatementService.parse(file.getInputStream(), bankType))
                .build();
    }
}
