export const base_url = (array = [], get = {}) => {

    let base = `${import.meta.env.VITE_API_URL || 'https://api.inmero.co/sigcon/dev/'}`;

    // Quitar slash final de la base
    base = base.replace(/\/+$/, '');

    // Construir path sin slash inicial
    const path = array.length > 0
        ? array.join('/').replace(/^\/+/, '')
        : '';

    const query = Object.entries(get)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

    const urlFinal = path ? `${base}/${path}` : base;

    

    return query ? `${urlFinal}?${query}` : urlFinal;
}


export const base_redirect_path = (is_login = false) => {
    const joinPath = (...parts) =>
        parts.join('/').replace(/\/+/g, '/')

    const base = import.meta.env.VITE_ENVIRONMENT == 'local'
        ? '/' : import.meta.env.VITE_ENVIRONMENT == 'development'
            ? '/sigcon/dev/' : '/sigcon/'

    return is_login
        ? joinPath(base, '/login')
        : joinPath(base, '/dashboard')
}

export const validarArrays = (a, b) => {
    if (a.length !== b.length) return false;

    const sortedA = [...a].sort();
    const sortedB = [...b].sort();

    return sortedA.every((value, index) => value === sortedB[index]);
}


export const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

export function lightenColor(hex, percent = 75) {
    // Quitar #
    hex = hex.replace("#", "");

    // Convertir a RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Mezclar con blanco
    r = Math.round(r + (255 - r) * (percent / 100));
    g = Math.round(g + (255 - g) * (percent / 100));
    b = Math.round(b + (255 - b) * (percent / 100));

    // Convertir de nuevo a HEX
    return (
        "#" +
        r.toString(16).padStart(2, "0") +
        g.toString(16).padStart(2, "0") +
        b.toString(16).padStart(2, "0")
    );
}

export function separateNumber(number, separator = '.'){
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

export function formatPrice(price, currency = 'COP', locale = 'es-CO', minimumFractionDigits = 0){
    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: minimumFractionDigits
    })
    return formatter.format(price)
}

export const separador_miles = (numero) => {
    const formatter = new Intl.NumberFormat('es-CO', {
        style: 'decimal',
        minimumFractionDigits: 2,
    });
    return formatter.format(numero);
};

export const valueFormat = (valor) => {
    const numero = Number(valor);
    if (isNaN(numero)) return valor;
  
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const format_number = (numero) => {
    return parseFloat(numero.replace(/[a-zA-Z]/g, '').replace(/\./g, '').replace(',', '.'));
}

export function updateFormattedValue(input) {
    let value = input.value;
  
    // Remover letras, puntos de miles y convertir coma decimal a punto
    value = value.replace(/^0+/, '').replace(/[a-zA-Z]/g, '').replace(/\./g, '').replace(',', '.');
  
    // Convertir el valor en número flotante
    let numericValue = parseFloat(value);
  
    if (!isNaN(numericValue)) {
        // Formatear el valor como número con separadores de miles
        const formattedValue = separador_miles(numericValue);
  
        // Posición del cursor antes de actualizar el valor
        const cursorPosition = input.selectionStart;
  
        // Actualizar el valor del input
        input.value = formattedValue;
        
  
        // Restaurar la posición del cursor
        setTimeout(() => {
            input.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
    }
}


export function adjustCurrency({
    price,
    fromCurrency,
    toCurrency,
    exchangeRate,
}) {
    if (!price) return 0;
    if (fromCurrency === toCurrency) return price;
    if (!exchangeRate) return price;
    if (exchangeRate.value === 0) return price;

    const user = localStorage.getItem('user');
    const company = JSON.parse(user).company;
    const base = company.currencyType.isoCode;
    
    if (toCurrency === base) return price * exchangeRate;
    
    if (fromCurrency === base) return price / exchangeRate;
    
    return price;
}
    
export function formatDate(date, format = 'DD-MM-YYYY HH:mm') {
    if (!date) return '';
    let d;
    const hasTime = typeof date === 'string' && (date.includes('T') || date.includes(' '));

    if (!hasTime) {
        const [year, month, day] = date.split('-');
        d = new Date(year, month - 1, day);
    } else {
        d = new Date(date);
    }

    if (isNaN(d)) return '';

    const map = {
        DD: String(d.getDate()).padStart(2, '0'),
        MM: String(d.getMonth() + 1).padStart(2, '0'),
        YYYY: d.getFullYear(),
        HH: String(d.getHours()).padStart(2, '0'),
        mm: String(d.getMinutes()).padStart(2, '0'),
        ss: String(d.getSeconds()).padStart(2, '0'),
    };

    return format.replace(/DD|MM|YYYY|HH|mm|ss/g, key => map[key]);
}

export const normalizeDate = (input = null, options = {}) => {
    const {
      endOfDay = false, // si quieres 23:59:59
    } = options;
  
    let date;
  
    if (!input) {
      date = new Date();
    } else if (typeof input === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        date = new Date(input + "T00:00:00");
      } else {
        date = new Date(input);
      }
    } else {
      date = new Date(input);
    }
  
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    }
    const localDate = date.toLocaleDateString("es-CO");
  
    return {
      date,
      iso: date.toISOString(),
      localDate,
    };
};

export function generateInvoiceCode(typeInvoice, resolution, limit = 5){
    return `${typeInvoice}-${String(resolution).padStart(limit, '0')}`;
}

export function generateVoucherCode(number){
    return `${String(number).padStart(5, '0')}`;
}