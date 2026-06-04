import { useEffect, useRef } from "react";

const InputDate = ({
    id,
    label,
    date,
    onChange,
    error,
    placeholder,
    required,
    dateFormat = 'd-m-Y',
    maxDate = undefined,
    minDate = undefined, disabled, editable = true }) => {

    const dateRef = useRef(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        const $date = $(dateRef.current);
    }, []);

    useEffect(() => {
        const $date = $(dateRef.current);
        const config = {
            mode: 'single',
            dateFormat: dateFormat,
            placeholder: placeholder,
            required: required,
            defaultDate: date,
            onChange: (selectedDates, dateStr, instance) => {
                onChangeRef.current?.(dateStr ? dateStr : null);
            },
            disabled: disabled
        };
        if (maxDate !== undefined) config.maxDate = maxDate;
        if (minDate !== undefined) config.minDate = minDate;
        $date.flatpickr(config);
    }, []);

    return (
        <div className="form-floating form-floating-outline">
            <input
                type="text"
                placeholder={placeholder}
                value={date ?? ''}
                onChange={(e) => onChangeRef.current?.(e.target.value)}
                className={`form-control ${error ? 'is-invalid' : ''}`}
                required={required}
                ref={dateRef}
                disabled={disabled}
            />
            <label htmlFor={id}>{label}{required ? <span className="text-danger">*</span> : null}</label>
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    )
}

export default InputDate;