package com.sigcon.backend.utils;

public class InvoiceUtil {

    public static String codeInvoice(String prefix, String serial) {

        System.out.println("prefix: " + prefix);
        System.out.println("serial: " + serial);

        return prefix + "-" + String.format("%05d", Integer.parseInt(serial.replaceAll("\\D", "")));
    }

}
