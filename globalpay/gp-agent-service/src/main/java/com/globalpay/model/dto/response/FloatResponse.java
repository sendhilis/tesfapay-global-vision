package com.globalpay.model.dto.response;
import lombok.*;
import java.math.BigDecimal;
@Data @Builder public class FloatResponse { private BigDecimal balance; private BigDecimal limit; private int percentage; }
