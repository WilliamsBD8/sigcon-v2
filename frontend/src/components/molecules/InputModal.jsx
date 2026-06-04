import { separador_miles, updateFormattedValue } from "@/utils/functions";
import { useEffect, useRef } from "react";

const InputModal = ({
    type = 'text',
    id,
    label,
    value,
    onChange,
    error,
    placeholder,
    disabled = false,
    required = false, readOnly = false, maxLength, inputMode, pattern, min, max
}) => {

    const inputRef = useRef(null);

    const handleChange = (e) => {
        const cursor = e.target.selectionStart;

        if(type === 'number') {
            const raw = e.target.value.replace(/^0+/, "").replace(/\./g, "");
            e.target.value = raw;
        }
        onChange(e);
    };

    return (
        <div className="form-floating form-floating-outline">
            <input
                ref={inputRef}
                type={type}
                id={id}
                className={`form-control ${error ? 'is-invalid' : ''} ${required ? 'required' : ''}`}
                placeholder={placeholder}
                value={value ?? ''}
                onChange={handleChange}
                disabled={disabled}
                readOnly={readOnly}
                {...(maxLength ? { maxLength } : {})}
                {...(inputMode ? { inputMode } : {})}
                {...(pattern ? { pattern } : {})}
                {... (min ? { min } : {})}
                {... (max ? { max } : {})}
            />
            <label htmlFor={id}>{label} {required && <span className="text-danger">*</span>}</label>
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    )
}

export default InputModal;