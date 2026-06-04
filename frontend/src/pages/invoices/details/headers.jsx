import AlertPage from "@/components/molecules/AlertPage";
import { generateInvoiceCode } from "@/utils/functions";
import { useState } from "react"
import { useNavigate } from "react-router-dom";

const HeaderForm = ({
    title = "Crear",
    type,
    serial = "X"
}) => {

    const navigate = useNavigate();

    const [message, setMessage] = useState({
        message: "",
        type: "",
        show: false,
        time: 3000,
        html: false,
    })

    return (
        <div className="card-header">
            <h4 className={`text-center border-bottom border-2 border-secondary pb-2`}>
                {title} {type.name}
            </h4>
        
            <div className="row d-flex justify-content-between align-items-center">
                <div className="col-12 col-md-10">
                    
                    <h5 className="card-title mb-1">{type.name}</h5>
                    <p className="card-subtitle mb-0">{generateInvoiceCode(type?.code, serial)}</p>
                </div>
                <div className="col-12 col-md-2">
                    <button className="btn btn-secondary me-2 w-100" onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line"></i> Volver
                    </button>
                </div>
            </div>
            
            <AlertPage
                type={message.type}
                message={message.message}
                html={true}
                show={message.show}
                duration={message.time}
                onChange={() => setMessage({ message: '', type: '', show: false, time: 3000, html: false })}
            />
        </div>

    )
}

export default HeaderForm;