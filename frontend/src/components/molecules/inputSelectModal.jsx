import { useEffect, useRef, useState } from 'react';
import { base_url } from '../../utils/functions';

const InputSelectModal = ({
    id, labelOption = null, label, value, onChange, error, options, placeholder, readOnly = false,
    clearable = false, multiple = false, required = false, disabled = false,
    url = null,
    searchFields = ['code', 'name'], newOption = false,
    filtersFields = []
}) => {

    const selectRef = useRef(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {

        const $select = $(selectRef.current);

        // destruir si existe
        if ($select.hasClass("select2-hidden-accessible")) {
            $select.select2('destroy');
        }

        // Inicializar Select2
        $select.select2({
            dropdownParent: $select.parent(), // clave si está en modal
            placeholder: url != null ? `Cargando ${placeholder}...` : placeholder || 'Seleccione una opción',
            ...(
                url != null ? {
                    // minimumInputLength: 2,
                    ajax: {
                        url: base_url(url),
                        dataType: 'json',
                        method: 'POST',
                        contentType: 'application/json',
                        beforeSend: function (xhr) {
                            const token = localStorage.getItem('token'); // o donde lo guardes
                            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                        },
                        ...(readOnly == true ? {
                            disabled: true
                        } : {}),
                        delay: 500,
                        data: function (params) {
                            const columns = searchFields.map(s => ({
                                data: s,
                                name: '',
                                searchable: true
                            }));
                            if(filtersFields.length > 0) {
                                columns.push(...filtersFields.map(f => ({
                                    data: f.data,
                                    name: '',
                                    searchable: f.searchable,
                                    search: f.search
                                })));
                            }
                            return JSON.stringify({
                                length: 50,
                                columns: columns,
                                search: {
                                    value: params.term,
                                    regex: true
                                }
                            });
                        },
                        processResults: function (data) {
                            return {
                                results: data.data.map(item => ({
                                    id: item.id,
                                    text: searchFields.map(f => item[f]).join(' - ')
                                }))
                            };
                        }
                    }
                } : {}
            ),
            width: '100%',
            allowClear: required ? false : clearable,
            language: {
                noResults: () => 'No se encontraron resultados',
            },
            tags: newOption === true,
       
            createTag: newOption === true ? function (params) {
                const term = params.term?.trim();
                if (!term) return null;
        
                return {
                    id: term,
                    text: term,
                    newTag: true
                };
            } : undefined,
            templateResult: function (data) {
                if (data.newTag) {
                    return $('<span>').text(data.text + ' (Nuevo)');
                }
                return data.text;
            },
        });

        const handleChange = function () {
            const newValue = $(this).val();
            onChangeRef.current?.(newValue);
        };

        $select.on('change', handleChange);

        $select.val(value).trigger('change.select2');

        return () => {
            $select.off('change', handleChange);
            if ($select.hasClass('select2-hidden-accessible')) {
                $select.select2('destroy');
            }
        };
    }, [options, error, id, disabled, placeholder, url, readOnly, clearable, multiple, required]);

    // Sincronizar value desde React
    useEffect(() => {
        const $select = $(selectRef.current);

        if(value == null){
            $select.val(value).trigger('change.select2');
            return;
        }

        if($select.find(`option[value="${value}"]`).length) {
            $select.val(value).trigger('change.select2');
            return;
        }
        if (url == null && options.length > 0) {
            $select.append(value).trigger('change.select2');
            return;
        }

        if (url != null) {
            if (!$select.find(`option[value="${value}"]`).length) {
                const option = new Option(labelOption || value, value, true, true);
                $select.append(option);
            }
        
            $select.val(value).trigger('change.select2');
            return;
        }
    
    }, [value]);

    return (
        <div className="form-floating form-floating-outline">
            <select
                id={id}
                ref={selectRef}
                className={`form-select ${error ? 'is-invalid' : ''}`}
                multiple={multiple}
                disabled={disabled}
            >
                <option value="">{placeholder || 'Seleccione una opción'}</option>
                {url == null ? options.map((option, idx) => (
                    <option
                        key={`${String(option.id).replace(/\s+/g, '_')}_${String(id).replace(/\s+/g, '_')}_${idx}`}
                        value={option.id} disabled={option.disabled}>
                        {option.label || option.name}
                    </option>
                )) : null}
            </select>
            <label htmlFor={id}>{label} {required ? <span className="text-danger">*</span> : null}</label>
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
};

export default InputSelectModal;
