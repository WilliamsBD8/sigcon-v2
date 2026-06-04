package com.sigcon.backend.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class Currency {

    public static BigDecimal convertCurrency(
        BigDecimal amount,
        String fromCurrency,
        String toCurrency,
        BigDecimal exchangeRate
    ) {

        String baseCurrency = UserUtil.getUserStatic().getCompany().getCurrencyType().getIsoCode();

        if(fromCurrency.equals(toCurrency)) {
            return amount;
        }
        if(fromCurrency == null || toCurrency == null) {
            return amount;
        }
        if(amount == null) {
            throw new IllegalArgumentException("El monto es requerido");
        }

        if(toCurrency.equals(baseCurrency)) {
            return amount.divide(exchangeRate, 2, RoundingMode.HALF_UP);
        }else if(fromCurrency.equals(baseCurrency)) {
            return amount.multiply(exchangeRate);
        }else {
            return amount;
        }
    }

}
