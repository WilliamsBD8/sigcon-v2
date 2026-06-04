import { adjustCurrency, formatPrice } from "@/utils/functions";
import { useEffect, useState } from "react";

const TotalsInvoice = ({
    invoice,
    thirdParty = null,
    company,
    exchangeRate,
    send,
    isSending,
    readOnly = false,
}) => {

    const [totalBase, setTotalBase] = useState({
        neto: 0,
        descuento: 0,
        impuesto: 0,
    });
    const [totalBaseExchange, setTotalBaseExchange] = useState({
        neto: 0,
        descuento: 0,
        impuesto: 0,
    });

    const isExchangeRate = invoice?.exchangeRate === null;

    useEffect(() => {

        const lineInvoices = invoice?.lineInvoices?.filter(li => !li.isDeleted);

        const totalNeto = lineInvoices?.reduce((acc, item) => {
            const prices = item.price * item.quantity;
            return acc + prices;
        }, 0);

        const totalDescuento = lineInvoices?.reduce((acc, item) => {
            const total = item.price * item.quantity;
            if(item?.discount?.percentage !== 0) {
                return acc + (total * item.discount.percentage / 100);
            }else{
                return acc + item?.discount?.value;
            }
        }, 0);

        const totalImpuesto = lineInvoices?.reduce((acc, item) => {
            const total = (item.price * item.quantity) - totalDescuento;
            const taxValue = item?.taxRulesIds?.reduce((acc, taxRuleId) => {
                if(taxRuleId?.percentage !== 0) {
                    return acc + (total * taxRuleId.percentage / 100);
                }else{
                    return acc + (total * taxRuleId?.value);
                }
            }, 0);
            return acc + taxValue;
        }, 0);

        setTotalBase({
            neto: totalNeto,
            descuento: totalDescuento,
            impuesto: totalImpuesto
        });
    }, [invoice]);

    useEffect(() => {
        if(exchangeRate?.value !== undefined) {
            const newData = {
                neto: adjustCurrency({
                    price: totalBase.neto,
                    fromCurrency: invoice?.thirdParty?.currencyType?.isoCode ?? thirdParty?.currencyType?.isoCode,
                    toCurrency: company.currencyType.isoCode,
                    exchangeRate: exchangeRate.value
                }),
                descuento: adjustCurrency({
                    price: totalBase.descuento,
                    fromCurrency: invoice?.thirdParty?.currencyType?.isoCode ?? thirdParty?.currencyType?.isoCode,
                    toCurrency: company.currencyType.isoCode,
                    exchangeRate: exchangeRate.value
                }),
                impuesto: adjustCurrency({
                    price: totalBase.impuesto,
                    fromCurrency: invoice?.thirdParty?.currencyType?.isoCode ?? thirdParty?.currencyType?.isoCode,
                    toCurrency: company.currencyType.isoCode,
                    exchangeRate: exchangeRate.value
                })
            }
            setTotalBaseExchange(newData);
        }

    }, [totalBase, exchangeRate]);

    return (
        <>
            <div className={`card ${readOnly ? 'mb-4' : 'mb-0'}`}>
                <div className="card-body">
                    <div className="row align-items-end justify-content-center">
                        <div className={`col-12 col-md-${readOnly ? '12' : '6'}`}>
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>-</th>
                                        <th>{invoice?.thirdParty?.currencyType?.isoCode ?? thirdParty?.currencyType?.isoCode ?? "COP"}</th>
                                        {
                                            !isExchangeRate && (
                                                <th>{company.currencyType.isoCode}</th>
                                            )
                                        }
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-0"><b>Base</b></td>
                                        <td className="p-0">{formatPrice(totalBase.neto, invoice?.thirdParty?.currencyType?.isoCode)}</td>
                                        {
                                            !isExchangeRate && (
                                                <td className="p-0">{formatPrice(totalBaseExchange.neto, company.currencyType.isoCode)}</td>
                                            )
                                        }
                                    </tr>
                                    <tr>
                                        <td className="p-0"><b>Descuento</b></td>
                                        <td className="p-0">{formatPrice(totalBase.descuento, invoice?.thirdParty?.currencyType?.isoCode)}</td>
                                        {
                                            !isExchangeRate && (
                                                <td className="p-0">{formatPrice(totalBaseExchange.descuento, company.currencyType.isoCode)}</td>
                                            )
                                        }
                                    </tr>
                                    <tr>
                                        <td className="p-0"><b>Impuesto</b></td>
                                        <td className="p-0">{formatPrice(totalBase.impuesto, invoice?.thirdParty?.currencyType?.isoCode)}</td>
                                        {
                                            !isExchangeRate && (
                                                <td className="p-0">{formatPrice(totalBaseExchange.impuesto, company.currencyType.isoCode)}</td>
                                            )
                                        }
                                    </tr>
                                    <tr>
                                        <td className="p-0"><b>Total</b></td>
                                        <td className="p-0">{formatPrice((totalBase.neto - totalBase.descuento) + totalBase.impuesto, invoice?.thirdParty?.currencyType?.isoCode)}</td>
                                        {
                                            !isExchangeRate && (
                                                <td className="p-0">{formatPrice((totalBaseExchange.neto - totalBaseExchange.descuento) + totalBaseExchange.impuesto, company.currencyType.isoCode)}</td>
                                            )
                                        }
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {!readOnly && (
                            <div className="col-12 col-md-6">
                                <div className="d-flex justify-content-lg-end justify-content-center my-2">
                                    <button className="btn btn-primary me-2" onClick={send} disabled={isSending}>
                                        {isSending ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : <i className="ri-add-line"></i>} Guardar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default TotalsInvoice;