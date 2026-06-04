import AlertPage from "@/components/molecules/AlertPage";
import InputModal from "@/components/molecules/InputModal";
import InputSelectModal from "@/components/molecules/inputSelectModal";
import { formatPrice } from "@/utils/functions";
import { useEffect, useState } from "react";

const TaxRetentionDetail = ({
    modalRef,
    modalInstance,
    thirdParty,
    rules,
    item,
    setItem,
    onchange
}) => {

    const [validate, setValidate] = useState(false);
    const [message, setMessage] = useState({ message: '', type: '', show: false, time: 3000, html: false });

    useEffect(() => {
        console.log(item, "Item taxRetentionDetail");
    }, [item]);

    return (
        <div className="col-lg-4 col-md-6">
            <div className="mt-4">
                <div className="modal fade" ref={modalRef} id="modalCenter" tabIndex="-1" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title" id="modalCenterTitle">Reglas de impuesto</h4>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if(modalInstance.current) {
                                            modalInstance.current.hide();
                                        }
                                    }}
                                    className="btn-close"
                                    aria-label="Close"></button>
                            </div>

                            <div className="modal-body">
                                <table className="table table-bordered table-sm">
                                    <thead>
                                        <tr>
                                            <th colSpan="3" className="text-center p-2">Impuestos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            thirdParty?.typeRegimen?.code === 'RESPONSABLE_IVA' ? (
                                                <>
                                                    <tr>
                                                        <td>IVA</td>
                                                        <td>
                                                            <div className="row">
                                                                <div className="col-12">
                                                                    <InputSelectModal
                                                                        id="rulerTaxId"
                                                                        label="Regla de impuesto"
                                                                        name="rulerTaxId"
                                                                        options={rules.map(r => ({label: `${r.name} - ${r.percentage}%`, id: r.id}))}
                                                                        value={item?.taxRulesIds[0]?.taxId || null}
                                                                        onChange={(value) => {
                                                                            const rulerTax = rules.find(r => r.id == value);
                                                                            setItem({ ...item, taxRulesIds: [
                                                                                {taxId: value, percentage: rulerTax?.percentage || 0, value: rulerTax?.value || 0 }
                                                                            ] });
                                                                        }}
                                                                        required={true}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {formatPrice(item?.taxRulesIds?.reduce((acc, r) => {
                                                                const prices = item.price * item.quantity;
                                                                const discount = item.discount?.percentage ? (prices * item.discount.percentage) / 100 : 
                                                                item.discount?.value ? item.discount.value : 0;
                                                                const value = ((r.percentage * (prices - discount)) / 100);
                                                                return acc + value;
                                                            }, 0))}
                                                        </td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <tr>
                                                    <td>IVA</td>
                                                    <td>0%</td>
                                                </tr>
                                            )
                                        }
                                    </tbody>
                                </table>
                                {
                                    rules.some(r => r.typeRulerTax === 'WHITHOLDING') && (
                                        <table className="table table-bordered table-sm">
                                            <thead>
                                                <tr>
                                                    <th colSpan="3" className="text-center p-2">Retenciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Retenciones</td>
                                                    <td>Retenciones</td>
                                                    <td>Retenciones</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    )
                                }
                                <table className="table table-bordered table-sm">
                                    <thead>
                                        <tr>
                                            <th colSpan="2" className="text-center p-2">
                                                Descuentos
                                                <br />
                                                <small className="text-muted">
                                                    El descuento se aplica al subtotal de la orden de compra
                                                </small>
                                                <AlertPage
                                                    message={message.message}
                                                    type={message.type}
                                                    show={message.show}
                                                    duration={message.time}
                                                    html={message.html}
                                                    onChange={() =>setMessage({
                                                        message: '',
                                                        type: '',
                                                        show: false,
                                                        time: 3000,
                                                        html: false
                                                    })}
                                                />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <InputModal
                                                    id="discountPercentage"
                                                    label="Porcentaje de descuento"
                                                    type="number"
                                                    name="discountPercentage"
                                                    value={item?.discount?.percentage || 0}
                                                    onChange={(e) => {
                                                        const percentage = Number(e.target.value);
                                                        if(percentage < 0 || percentage > 100) {
                                                            return;
                                                        }
                                                        setItem({ ...item, discount: { percentage: percentage, value: 0 } });
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <InputModal
                                                    id="discountValue"
                                                    label="Valor de descuento"
                                                    type="number"
                                                    name="discountValue"
                                                    value={item?.discount?.value || 0}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        if(value < 0) {
                                                            setMessage({ message: 'El valor de descuento no puede ser menor a 0', type: 'warning', show: true, time: 3000, html: false });
                                                            return;
                                                        }else if(value > item?.price * item?.quantity) {
                                                            setMessage({ message: 'El valor de descuento no puede ser mayor al subtotal', type: 'warning', show: true, time: 0, html: false });
                                                            return;
                                                        }
                                                        setItem({ ...item, discount: { percentage: 0, value: value } });
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-secondary" onClick={() => {
                                    if(modalInstance.current) {
                                        modalInstance.current.hide();
                                    }
                                }}>
                                    Cerrar
                                </button>
                                <button type="button" className="btn btn-primary" onClick={onchange}>Guardar</button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TaxRetentionDetail