import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const PageBlock = ({
    title,
    description
}) => {

    const navigate = useNavigate();

    return <>
        <div className="misc-wrapper h-100">
            <h1 className="mb-2 mx-2">{title}</h1>
            <p className="mb-6 mx-sm-2 text-center">
                {description}
            </p>
            <div className="d-flex justify-content-center mt-9">
                
                <div className="d-flex flex-column align-items-center">
                    <button className="btn btn-primary me-2" onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line"></i> Volver
                    </button>
                </div>
            </div>
        </div>
    </>
}

export default PageBlock;