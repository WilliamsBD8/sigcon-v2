# Manual de usuario — SIGCON

**Sistema de Gestión Contable y Financiera**  
Versión documentada: 2026-1 · Proyecto Integrador — USCO

---

## Tabla de contenidos

1. [Introducción](#1-introducción)
2. [Requisitos y acceso](#2-requisitos-y-acceso)
3. [Interfaz general](#3-interfaz-general)
4. [Dashboard](#4-dashboard)
5. [Parametrización](#5-parametrización)
6. [Listas contables](#6-listas-contables)
7. [Terceros](#7-terceros)
8. [Tesorería (cajas y bancos)](#8-tesorería-cajas-y-bancos)
9. [Facturación](#9-facturación)
10. [Comprobantes contables](#10-comprobantes-contables)
11. [Activos fijos](#11-activos-fijos)
12. [Reportes contables](#12-reportes-contables)
13. [Asistente con IA](#13-asistente-con-ia)
14. [Permisos y visibilidad de menús](#14-permisos-y-visibilidad-de-menús)
15. [Mensajes de error frecuentes](#15-mensajes-de-error-frecuentes)
16. [Buenas prácticas](#16-buenas-prácticas)

---

## 1. Introducción

SIGCON permite a su empresa registrar operaciones contables y financieras en un solo lugar: catálogo PUC, cuentas auxiliares, facturas, pagos, comprobantes con asiento contable, bancos, caja, activos fijos y reportes.

Cada usuario ve únicamente los módulos y acciones autorizados por su rol. Los datos mostrados (facturas, saldos, KPIs) corresponden a la **empresa asociada** a su usuario, salvo perfiles de administración global.

---

## 2. Requisitos y acceso

### 2.1 Navegador recomendado

- Google Chrome, Microsoft Edge o Firefox (versiones recientes).
- JavaScript habilitado.
- Conexión estable a la red donde esté desplegado el sistema.

### 2.2 Inicio de sesión

1. Abra la URL proporcionada por su administrador (por ejemplo `http://localhost:5173` en desarrollo).
2. En la pantalla de **Inicio de sesión**, ingrese:
   - **Correo o usuario**
   - **Contraseña**
3. Pulse **Iniciar sesión**.

Si las credenciales son correctas, el sistema guarda la sesión y redirige al **Dashboard**.

### 2.3 Recuperar contraseña

1. En el login, seleccione **¿Olvidó su contraseña?**
2. Ingrese el correo registrado.
3. Revise su bandeja de entrada y siga el enlace para restablecer la contraseña.

### 2.4 Cerrar sesión

Use la opción de cerrar sesión en el menú de usuario (esquina superior). Si el token expira, el sistema solicitará iniciar sesión nuevamente.

---

## 3. Interfaz general

| Elemento | Descripción |
|----------|-------------|
| **Menú lateral** | Módulos agrupados (Parametrización, Listas contables, Activos, etc.). Solo aparecen opciones autorizadas. |
| **Barra superior** | Usuario, empresa y accesos rápidos. |
| **Área de contenido** | Tablas, formularios y reportes del módulo activo. |
| **Botón flotante (chat)** | Abre el **Asistente SIGCON** (esquina inferior derecha), si está habilitado. |

### Convenciones en tablas

- **Buscar / filtrar**: caja de búsqueda y, en algunos módulos, botón de filtros avanzados.
- **Exportar**: menú **Opciones** → exportar a Excel/PDF según módulo.
- **Acciones por fila**: iconos de ver, editar o eliminar (según permisos).
- **Crear**: botón principal (por ejemplo *Nuevo*, *Registrar*, *Emitir*).

---

## 4. Dashboard

Al ingresar verá un resumen con indicadores de su empresa:

- Cantidad de facturas, comprobantes, activos, cuentas bancarias y usuarios.
- Montos totales de facturas, comprobantes y saldo bancario consolidado.
- Gráficos de tendencia mensual (facturas y comprobantes).

Los usuarios con perfil de **administración global** pueden ver indicadores de todas las empresas.

---

## 5. Parametrización

> Módulo orientado a administradores del sistema.

| Función | Uso habitual |
|---------|----------------|
| **Usuarios** | Crear usuarios, asignar empresa, roles y estado. |
| **Roles** | Definir perfiles (contador, tesorero, etc.) y permisos. |
| **Permisos** | Catálogo de acciones del sistema (crear, ver, editar, eliminar). |
| **Empresas** | Datos legales, NIT, moneda, representante. |
| **Módulos y menús** | Estructura de navegación y componentes de pantalla. |
| **Permisos de menú** | Qué roles ven cada ítem del menú. |
| **Parámetros** | Valores generales de configuración. |
| **Perfil** | Datos del usuario conectado (nombre, avatar, contraseña). |

**Recomendación:** no elimine roles o permisos en uso sin revisar usuarios asignados.

---

## 6. Listas contables

Base del catálogo contable de la empresa.

### 6.1 Catálogo PUC

Consulta y mantenimiento del Plan Único de Cuentas (código, nombre, clase, nivel, naturaleza).

### 6.2 Cuentas contables

Crea cuentas auxiliares vinculadas al PUC para su empresa:

- Nombre personalizado.
- Moneda y centro de costo (opcional).
- Naturaleza débito/crédito y estado activo/inactivo.

### 6.3 Centros de costo

Segmentación analítica para imputar gastos e ingresos.

### 6.4 Reglas tributarias y tasas de cambio

- **Reglas tributarias:** configuración de impuestos aplicables a cuentas o operaciones.
- **Tasas de cambio:** valores de conversión entre monedas.
- **Tipos de moneda:** catálogo de monedas (COP, USD, etc.).

### 6.5 Reglas de depreciación

Parámetros para el cálculo automático de depreciación de activos.

---

## 7. Terceros

Gestión de **proveedores, clientes** y otros terceros.

| Pantalla | Acción |
|----------|--------|
| **Lista de terceros** | Alta, edición, consulta por NIT, ciudad, segmento. |
| **Segmentación** | Clasificación comercial o contable de terceros. |

Los terceros se usan al crear facturas de compra u órdenes de venta.

---

## 8. Tesorería (cajas y bancos)

### 8.1 Cajas

Registro de puntos de efectivo (caja menor, caja general) con cuenta contable asociada.

### 8.2 Bancos y sucursales

- **Catálogo de bancos:** entidades financieras.
- **Sucursales:** oficinas por banco (acceso desde el detalle del banco).

### 8.3 Cuentas bancarias

Alta de cuentas corriente, ahorro o tarjeta con:

- Banco y número de cuenta.
- Cuenta contable del activo (clase ACTIVO, prefijos 11xx).
- Saldo inicial y seguimiento de movimientos.

### 8.4 Chequeras y cheques

1. Cree la **chequera** ligada a una cuenta bancaria.
2. **Emita cheques** con beneficiario, valor y concepto.
3. Actualice estados: emitido, cobrado, anulado, extraviado.
4. **Concilie** cheques con movimientos bancarios cuando corresponda.

### 8.5 Conciliación bancaria

Desde la cuenta bancaria puede comparar el extracto con los comprobantes del sistema y emparejar movimientos.

---

## 9. Facturación

### 9.1 Órdenes de compra (OC)

Documento previo a la factura de venta del cliente:

1. **Listar** órdenes existentes.
2. **Crear** con tercero (cliente), líneas de producto/servicio, totales e impuestos.
3. **Editar** mientras el estado lo permita.

### 9.2 Facturas de compra (FC)

Registro de obligaciones con proveedores:

1. Acceda a **Facturas de compra**.
2. **Crear factura**: proveedor, fechas, líneas, retenciones, totales.
3. Guarde; el sistema valida totales y estados.

### 9.3 Pagos de factura

Desde la factura (o menú de pagos):

1. Abra **Pagos** / **Registrar pago**.
2. Complete:
   - **Monto** (no mayor al saldo pendiente).
   - **Método de pago** (efectivo, cheque, cuenta bancaria, etc.).
   - **Origen**: caja, banco o cheque según el método.
   - **Fecha** y **descripción**.
   - **Soporte** (archivo opcional).
3. Guarde el comprobante.

**Asiento automático en pagos de factura:**

| Tipo de factura | Comprobante | Comportamiento contable |
|-----------------|-------------|-------------------------|
| FC (compra) | Pago (`PAYMENT`) | Débito proveedores (22xx) / Crédito banco o caja |
| OC (venta) | Recibo (`RECEIPT`) | Débito banco o caja / Crédito cartera (13xx) |

El sistema muestra un aviso indicando que el asiento se genera automáticamente; no debe capturar líneas manuales en este flujo.

---

## 10. Comprobantes contables

Módulo para **ver y crear comprobantes** independientes de facturas (nómina, servicios, ajustes).

### 10.1 Listado

Muestra tipo, número, fecha, monto, descripción y factura vinculada (si aplica). Acciones: **ver**, **editar**, **eliminar** (según permisos).

### 10.2 Crear comprobante

1. Pulse **Nuevo comprobante**.
2. Seleccione el **tipo de comprobante**:

| Código | Nombre | Uso típico |
|--------|--------|------------|
| `PAYMENT` | Pago de compra | Pagos a proveedores (sin factura o vía módulo facturas) |
| `RECEIPT` | Recibo de venta | Cobros de clientes |
| `PAYROLL` | Pago de nómina | Salarios y prestaciones |
| `SERVICE_PAYMENT` | Pago de servicio | Servicios contratados |
| `SERVICE_RECEIPT` | Pago por prestación de servicios | Ingresos por servicios |

3. Ingrese **monto**, **método de pago**, **origen** (caja/banco/cheque) y **fecha**.
4. Si el tipo requiere **líneas contables manuales**, complete el bloque **Líneas contables** (ver tabla siguiente).
5. Adjunte soporte si es necesario y guarde.

### 10.3 Cuentas contables permitidas por tipo

El sistema **filtra las cuentas** según el tipo de comprobante y si la línea es **Débito** o **Crédito**:

| Tipo | Débito (cuentas sugeridas) | Crédito (cuentas sugeridas) |
|------|----------------------------|-----------------------------|
| Pago de compra / Pago servicio / Nómina | Pasivo (2xxx), gastos (5xxx, 6xxx, 7xxx) | Activos monetarios (11xx, 12xx) |
| Recibo de venta / Ingreso servicios | Activos monetarios (11xx, 12xx) | Cartera (13xx), ingresos (4xxx), pasivo (2xxx) |

Reglas:

- Debe haber **al menos dos líneas** (débito y crédito).
- **Total débito = total crédito = monto del comprobante**.
- Solo aparecen cuentas **activas** de su empresa.

### 10.4 Ver detalle

Desde el listado, use el icono **Ver** para consultar el comprobante y su asiento sin modificarlo.

---

## 11. Activos fijos

| Función | Descripción |
|---------|-------------|
| **Lista de activos** | Inventario de activos con placa, valor, vida útil, cuenta. |
| **Crear / editar activo** | Alta y modificaciones. |
| **Cálculo de depreciación** | Ejecución por periodo según reglas. |
| **Bajas y transferencias** | Retiro o traslado de activos. |
| **Kardex** | Historial de movimientos del activo. |
| **Verificación / corrección NIIF** | Alertas y ajustes de cumplimiento. |
| **Reporte de activos** | Informes exportables. |

**Productos:** catálogo de ítems usados en facturas e inventario.

---

## 12. Reportes contables

Desde el módulo de reportes (según menú asignado):

| Reporte | Propósito |
|---------|-----------|
| **Balance de comprobación** | Saldos de cuentas en un rango de fechas. |
| **Libro diario** | Movimientos cronológicos con débitos y créditos. |
| **Libro mayor** | Movimientos por cuenta. |
| **Auxiliares de cuenta** | Detalle por tercero o subcuenta. |
| **Estados financieros** | Presentación agregada para análisis. |

Seleccione **empresa**, **rango de fechas** y filtros indicados en cada pantalla antes de generar o exportar.

---

## 13. Asistente con IA

Botón flotante (icono de chat) en la esquina inferior derecha.

**Qué puede hacer:**

- Responder preguntas sobre indicadores de su sesión (facturas, comprobantes, saldos).
- Orientar en qué módulo realizar una tarea.

**Limitaciones:**

- No reemplaza criterio contable ni normativa vigente.
- Los números provienen del contexto de su empresa al momento de la consulta.
- Requiere que el administrador haya configurado el servicio de IA en el servidor.

**Ejemplos de preguntas:**

- «¿Cuántas facturas tiene registradas mi empresa?»
- «¿Cuál es el saldo en cuentas bancarias?»
- «¿Dónde registro un pago a proveedor?»

---

## 14. Permisos y visibilidad de menús

- Si **no ve un módulo**, su rol no tiene permiso o el menú no está asignado: contacte al administrador.
- Si una acción (crear, editar, eliminar) no aparece, falta el permiso correspondiente (por ejemplo `CREATE_VOUCHER`, `UPDATE_INVOICE_FC`).
- El perfil **SUPERADMIN** tiene acceso amplio; los usuarios operativos suelen tener permisos acotados por área.

---

## 15. Mensajes de error frecuentes

| Mensaje | Causa probable | Qué hacer |
|---------|----------------|-----------|
| Sesión expirada | Token vencido | Vuelva a iniciar sesión. |
| Permiso denegado | Sin autorización | Solicite permiso al administrador. |
| Periodo contable no está abierto | Periodo cerrado | Abra el periodo en contabilidad o use fechas del periodo activo. |
| El comprobante excede el total a pagar | Suma de pagos > factura | Reduzca el monto del pago. |
| Debe registrar líneas contables | Comprobante sin asiento válido | Agregue débitos y créditos cuadrados. |
| La cuenta no es válida para este tipo | Cuenta fuera del filtro | Elija otra cuenta de la lista filtrada. |
| Sin conexión | Servidor no disponible | Verifique red y que el backend esté en ejecución. |

---

## 16. Buenas prácticas

1. **Cierre de periodo:** no registre comprobantes en periodos cerrados.
2. **Soportes:** adjunte PDF o imagen en pagos y comprobantes relevantes.
3. **Conciliación:** concilie bancos al menos una vez por periodo.
4. **Terceros:** mantenga NIT y datos fiscales actualizados antes de facturar.
5. **Respaldo:** los administradores deben respaldar la base de datos periódicamente.
6. **Contraseñas:** no comparta credenciales; use contraseñas seguras.

---

## Soporte

Para incidencias técnicas o solicitud de permisos, contacte al administrador del sistema o al equipo de desarrollo del Proyecto Integrador.

Documentación técnica complementaria: [Manual de desarrollador](MANUAL_DESARROLLADOR.md) · [README del proyecto](../README.md)
