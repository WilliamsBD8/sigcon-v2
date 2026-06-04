import AlertPage from "@/components/molecules/AlertPage";
import InputModal from "@/components/molecules/InputModal";
import InputRadio from "@/components/molecules/InputRadio";
import InputSelectModal from "@/components/molecules/inputSelectModal";
import TextareaModal from "@/components/molecules/TextareaModal";
import { fetchHelper } from "@/utils/fetch";
import { base_url } from "@/utils/functions";
import { useEffect, useMemo, useState } from "react";

const FormProduct = ({
    product,
    setProduct,
    setMessage,
    closeModal,
    dataTableRef,
    accountingAccountsCodes
}) => {

    const [thirdParties, setThirdParties] = useState([]);
    const [accountingAccounts, setAccountingAccounts] = useState([]);

    const [errors, setErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState({
        message: '',
        type: '',
        show: false,
        time: 3000,
    });

    const requireds = useMemo(() => {
        return {
            name: {
                required: true,
                message: 'El nombre es requerido'
            },
            code: {
                required: true,
                message: 'El código es requerido'
            },
            thirdPartyId: {
                required: true,
                message: 'El proveedor es requerido'
            },
            description: {
                required: true,
                message: 'La descripción es requerida'
            },
        }
    }, []);

    const set = (field, value) => setProduct(prev => ({ ...prev, [field]: value }));

    const loadData = async () => {
        const [thirdPartiesResponse, accountingAccountsResponse] = await Promise.all([
            await fetchHelper.post(base_url(['api/v1/third-parties/search']), {
                length: -1,
                columns: [
                    { data: "status.id", searchable: true, search:{value: "1", regex: false} },
                    { data: "roles.id", searchable: true, search:{value: "2", regex: false} }
                ]
            }, {}, 0, false),
            await fetchHelper.post(base_url(['api/v1/accounting-accounts']), {
                length: -1,
                columns: [{ data: 'pucAccount.code', searchable: true, search: { value: accountingAccountsCodes, regex: true } }]
            }, {}, 0, false),
        ]);
        if (thirdPartiesResponse.code === 200) {
            setThirdParties(thirdPartiesResponse.data);
        }
        if (accountingAccountsResponse.code === 200) {
            setAccountingAccounts(accountingAccountsResponse.data);
        }
    }

    useEffect(() => {
        console.log(product);
    }, [product]);

    const sendData = async () => {

        const errors = Object.keys(requireds).filter(r => !product[r]).reduce((acc, r) => ({ ...acc, [r]: requireds[r].message }), {});
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }
        try{
            let response;
            let url;
            if (product.id) {
                url = base_url(['api/v1/products', product.id]);
                response = await fetchHelper.put(url, product, {}, 1, false);
            } else {
                url = base_url(['api/v1/products/create']);
                response = await fetchHelper.post(url, product, {}, 1, false);
            }
            console.log(response);
            dataTableRef?.current?.ajax.reload();

            closeModal();
            setMessage({ message: response.message, type: 'success', show: true, time: 3000 });
        } catch (error) {
            console.log(error);
            
            setErrorMessage({ message: error.message || error.msg || 'Error al crear el producto', type: 'danger', show: true, time: 0 });
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    return (
        <>
            <AlertPage
                message={errorMessage.message}
                type={errorMessage.type}
                show={errorMessage.show}
                onChange={() => setErrorMessage({ message: '', type: '', show: false, time: 3000 })}
                duration={errorMessage.time}
            />
            <div className="row">
                <div className="col-12 col-md-6 mb-3">
                    <InputModal
                        type="text"
                        id="name"
                        label="Nombre"
                        value={product.name}
                        onChange={(e) => set('name', e.target.value)}
                        error={errors.name}
                        placeholder="Nombre"
                        required
                    />
                </div>
                <div className="col-12 col-md-6 mb-3">
                    <InputModal
                        type="text"
                        id="code"
                        label="Código"
                        value={product.code}
                        onChange={(e) => set('code', e.target.value)}
                        error={errors.code}
                        placeholder="Código"
                        required
                    />
                </div>
            </div>

            <div className="row">
                <div className="col-12 col-md-6 mb-3">
                    <InputSelectModal
                        id="accountingAccountIds"
                        label="Cuentas contables"
                        labelOption="accountingAccountId"
                        options={accountingAccounts.map(a => ({label: `${a.pucAccount.code} - ${a.customName}`, id: a.id}))}
                        value={product.accountingAccountIds || []}
                        onChange={(value) => set('accountingAccountIds', value || [])}
                        error={errors.accountingAccountIds}
                        placeholder="Cuentas contables"
                        multiple
                        required
                    />

                </div>

                <div className="col-12 col-md-6 mb-3">
                    <InputSelectModal
                        id="thirdParty"
                        label="Proveedor"
                        labelOption="thirdPartyId"
                        options={thirdParties.map(t => ({label: `${t.businessName} - ${t.thirdPartyCode}`, id: t.id}))}
                        value={product.thirdPartyId}
                        onChange={(value) => set('thirdPartyId', value)}
                        error={errors.thirdPartyId}
                        placeholder="Proveedor"
                        required
                    />
                </div>
            </div>

            <div className="row">
                <div className="col-12 mb-3">
                    <TextareaModal
                        id="description"
                        label="Descripción"
                        value={product.description}
                        onChange={(e) => set('description', e.target.value)}
                        error={errors.description}
                        placeholder="Descripción"
                        required
                    />
                </div>
            </div>

            <div className="row">
                <div className="col-12 col-md-4 mb-3">
                    <InputModal
                        type="number"
                        id="price"
                        label="Precio de compra"
                        value={product.price ?? ''}
                        onChange={(e) => set('price', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                    />
                </div>
                <div className="col-12 col-md-4 mb-3">
                    <InputModal
                        type="number"
                        id="salePrice"
                        label="Precio de venta"
                        value={product.salePrice ?? ''}
                        onChange={(e) => set('salePrice', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                    />
                </div>
                <div className="col-12 col-md-4 mb-3">
                    <InputModal
                        type="number"
                        id="stock"
                        label="Stock inicial"
                        value={product.stock ?? ''}
                        onChange={(e) => set('stock', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step="0.0001"
                    />
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <button className="btn btn-primary" onClick={sendData}>Guardar</button>
                    <button className="btn btn-outline-secondary" onClick={closeModal}>Cancelar</button>
                </div>
            </div>
        </>
    )
}

export default FormProduct;