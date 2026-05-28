# Manual de usuario del software SIGCON

| Campo | Valor |
|-------|--------|
| **Identificación del documento** | SIGCON-MUD-001 |
| **Título** | Manual de usuario |
| **Producto** | SIGCON — Sistema de Gestión Contable y Financiera |
| **Versión del documento** | 1.1 |
| **Versión del producto** | 2026-1 (Proyecto Integrador USCO) |
| **Fecha** | 2026-05-28 |
| **Clasificación** | Uso operativo |
| **Estándar de referencia** | IEEE Std 1063-2001, IEEE Std 26515-2018 |

---

## Historial de revisiones

| Versión | Fecha | Autor / equipo | Descripción |
|---------|--------|----------------|-------------|
| 1.0 | 2026-05 | Equipo SIGCON | Versión inicial operativa |
| 1.1 | 2026-05-28 | Equipo SIGCON | Estructura IEEE; FV, comprobantes standalone, inventario |

---

## Tabla de contenidos

1. [Alcance y aplicabilidad](#1-alcance-y-aplicabilidad)
2. [Referencias normativas e informativas](#2-referencias-normativas-e-informativas)
3. [Definiciones, acrónimos y abreviaturas](#3-definiciones-acrónimos-y-abreviaturas)
4. [Descripción general del sistema](#4-descripción-general-del-sistema)
5. [Requisitos del entorno de uso](#5-requisitos-del-entorno-de-uso)
6. [Inicio de sesión y navegación](#6-inicio-de-sesión-y-navegación)
7. [Procedimientos por módulo](#7-procedimientos-por-módulo)
8. [Mensajes, errores y recuperación](#8-mensajes-errores-y-recuperación)
9. [Seguridad, permisos y buenas prácticas](#9-seguridad-permisos-y-buenas-prácticas)
10. [Soporte](#10-soporte)
- [Apéndice A — Matriz de permisos frecuentes](#apéndice-a--matriz-de-permisos-frecuentes)
- [Apéndice B — Tipos de comprobante y cuentas](#apéndice-b--tipos-de-comprobante-y-cuentas)

---

## 1. Alcance y aplicabilidad

### 1.1 Propósito

Este documento describe, para el **usuario final** y el **usuario administrador**, cómo utilizar SIGCON para registrar y consultar operaciones contables y financieras de una empresa.

### 1.2 Alcance del producto

SIGCON cubre, entre otros:

- Parametrización (usuarios, roles, empresas, menús).
- Listas contables (PUC, cuentas auxiliares, impuestos, tasas de cambio).
- Terceros (clientes, proveedores, empleados).
- Tesorería (cajas, bancos, cheques, conciliación).
- Facturación: órdenes de compra (OC), facturas de compra (FC), **facturas de venta (FV)**.
- Comprobantes contables (con y sin factura).
- Activos fijos, productos e inventario (stock).
- Reportes contables y dashboard.
- Asistente con IA (opcional).

### 1.3 Audiencia prevista

| Perfil | Uso de este manual |
|--------|-------------------|
| Contador / auxiliar contable | Facturas, comprobantes, reportes |
| Tesorero | Cajas, bancos, cheques, pagos |
| Administrador de activos | Activos, depreciación, productos |
| Administrador del sistema | Parametrización, roles, permisos |

### 1.4 Organización del documento

Los capítulos 6–7 siguen un enfoque **orientado a tareas** (recomendado en IEEE 1063): cada sección indica objetivo, precondiciones, pasos y resultado esperado.

---

## 2. Referencias normativas e informativas

| ID | Documento | Relación |
|----|-----------|----------|
| [R1] | IEEE Std 1063-2001 | Estructura de documentación de usuario de software |
| [R2] | IEEE Std 26515-2018 | Elaboración de documentación para usuarios en entornos ágiles |
| [R3] | Manual de desarrollador SIGCON (`MANUAL_DESARROLLADOR.md`) | Detalle técnico, API, despliegue |
| [R4] | README del proyecto (`../README.md`) | Instalación y arquitectura general |
| [R5] | Decreto 2420 de 2015 (PUC Colombia) | Marco del catálogo contable (referencia de negocio) |

---

## 3. Definiciones, acrónimos y abreviaturas

| Término | Definición |
|---------|------------|
| **Asiento contable** | Registro de débitos y créditos que debe cuadrar (partida doble). |
| **Comprobante** | Documento que registra un movimiento de tesorería y su contrapartida contable. |
| **FC** | Factura de compra (obligación con proveedor). |
| **FV** | Factura de venta (ingreso con cliente). |
| **OC** | Orden de compra (documento previo en flujo comercial). |
| **PUC** | Plan Único de Cuentas. |
| **Tercero** | Persona natural o jurídica (cliente, proveedor, empleado, etc.). |
| **Periodo contable** | Intervalo (mes/año) en el que se permiten movimientos. |
| **Stock** | Cantidad disponible de un producto en inventario. |
| **Precio de compra / venta** | Valor unitario de referencia en catálogo; puede actualizarse al facturar. |

| Acrónimo | Significado |
|----------|-------------|
| COP | Peso colombiano |
| JWT | Token de sesión (uso interno; el usuario solo inicia sesión) |
| KPI | Indicador clave en dashboard |
| NIIF | Normas Internacionales de Información Financiera |

---

## 4. Descripción general del sistema

### 4.1 Arquitectura desde la perspectiva del usuario

El usuario accede mediante un **navegador web** a la aplicación React. Todas las operaciones se validan en un servidor central; los datos pertenecen a la **empresa** asignada al usuario (salvo perfiles globales).

```
  Usuario → Navegador (SIGCON Web) → Servidor → Base de datos empresarial
```

### 4.2 Módulos funcionales

| Módulo | Función principal |
|--------|-------------------|
| Dashboard | Resumen de indicadores |
| Parametrización | Usuarios, roles, empresas, menús |
| Listas contables | PUC, cuentas, impuestos, depreciación |
| Terceros | Clientes, proveedores, empleados |
| Tesorería | Cajas, bancos, cheques |
| Facturas | OC, FC, FV, pagos |
| Comprobantes | Nómina, servicios, ajustes |
| Activos / productos | Activos fijos e inventario |
| Reportes | Libros y estados |

### 4.3 Convenciones de la interfaz

| Elemento | Descripción |
|----------|-------------|
| Menú lateral | Módulos autorizados por rol |
| Tablas | Búsqueda, paginación, exportación (según pantalla) |
| Botón crear | Alta de registros |
| Iconos por fila | Ver, editar, eliminar (según permiso) |
| Listas desplegables | Componente con búsqueda (Select2) |
| Chat flotante | Asistente IA (si está habilitado) |

---

## 5. Requisitos del entorno de uso

### 5.1 Hardware y software cliente

- PC o portátil con navegador actualizado (Chrome, Edge o Firefox).
- JavaScript habilitado.
- Resolución mínima recomendada: 1366×768.

### 5.2 Conectividad

- Acceso a la URL provista por el administrador (red local o VPN según despliegue).

### 5.3 Cuentas y credenciales

- Correo o usuario y contraseña asignados por el administrador.
- No compartir credenciales entre personas.

---

## 6. Inicio de sesión y navegación

### 6.1 Procedimiento: iniciar sesión

| Paso | Acción | Resultado esperado |
|------|--------|------------------|
| 1 | Abrir la URL del sistema | Pantalla de login |
| 2 | Ingresar correo y contraseña | Campos validados |
| 3 | Pulsar **Iniciar sesión** | Redirección al Dashboard |

**Precondiciones:** usuario activo y permisos asignados.

### 6.2 Procedimiento: recuperar contraseña

1. En login, seleccione **¿Olvidó su contraseña?**
2. Ingrese el correo registrado.
3. Siga el enlace recibido por correo.

### 6.3 Procedimiento: cerrar sesión

Use la opción de cierre de sesión en el menú de usuario (barra superior).

### 6.4 Navegación por módulos

Solo se muestran ítems del menú autorizados. Si falta un módulo, contacte al administrador (véase capítulo 9).

---

## 7. Procedimientos por módulo

### 7.1 Dashboard

**Objetivo:** consultar indicadores de la empresa.

**Pasos:** ingresar al sistema → Dashboard.

**Resultado:** totales de facturas, comprobantes, activos, saldos bancarios y gráficos de tendencia.

---

### 7.2 Parametrización (administradores)

| Tarea | Ruta habitual | Notas |
|-------|---------------|-------|
| Gestionar usuarios | Parametrización → Usuarios | Asignar empresa y rol |
| Gestionar roles | Parametrización → Roles | Vincular permisos |
| Empresas | Parametrización → Empresas | NIT, moneda |
| Menús y permisos de menú | Módulos / Menús | Visibilidad por rol |

---

### 7.3 Listas contables

**Objetivo:** mantener el catálogo contable base.

1. **PUC:** consultar y mantener códigos del plan.
2. **Cuentas contables:** crear auxiliares por empresa (código PUC, nombre, naturaleza).
3. **Centros de costo, reglas tributarias, tasas de cambio:** según necesidad de la empresa.
4. **Reglas de depreciación:** para el módulo de activos.

---

### 7.4 Terceros

**Objetivo:** registrar contrapartes comerciales.

| Rol en catálogo | Uso en SIGCON |
|-----------------|---------------|
| PROVEEDOR | Facturas de compra (FC) |
| CLIENTE | Facturas de venta (FV) |
| EMPLEADO | Comprobantes de nómina |

**Pasos típicos:** Terceros → Lista → Crear → completar NIT, razón social, ciudad, roles → Guardar.

---

### 7.5 Tesorería

#### 7.5.1 Cajas y cuentas bancarias

Registrar puntos de efectivo y cuentas bancarias con su **cuenta contable** asociada (clase activo, prefijos 11xx/12xx).

#### 7.5.2 Chequeras y cheques

1. Crear chequera ligada a cuenta bancaria.
2. Emitir cheques (beneficiario, valor, estado).
3. Conciliar con movimientos cuando corresponda.

#### 7.5.3 Conciliación bancaria

Desde la cuenta bancaria, compare extracto vs. movimientos del sistema y empareje partidas.

---

### 7.6 Facturación

#### 7.6.1 Órdenes de compra (OC)

**Objetivo:** documento previo en flujo de compras/ventas según configuración.

**Pasos:** Facturas → Órdenes de compra → Crear → tercero, líneas, totales → Guardar.

#### 7.6.2 Facturas de compra (FC)

**Objetivo:** registrar compra a proveedor e incrementar inventario.

| Paso | Acción |
|------|--------|
| 1 | Facturas de compra → Crear |
| 2 | Seleccionar **proveedor**, fecha de compra |
| 3 | Agregar **productos** (precio de compra, cantidad) |
| 4 | Revisar totales → Guardar |

**Efecto en inventario:** al guardar líneas, el **stock** del producto **aumenta** y puede actualizarse el **precio de compra** del catálogo.

#### 7.6.3 Facturas de venta (FV)

**Objetivo:** registrar venta a cliente y disminuir inventario.

| Paso | Acción |
|------|--------|
| 1 | Facturas de venta → Crear |
| 2 | Seleccionar **cliente**, fecha de venta |
| 3 | Agregar productos (se sugiere **precio de venta** y **stock** disponible) |
| 4 | La cantidad no puede superar el stock |
| 5 | Guardar |

**Efecto en inventario:** el **stock disminuye**; el **precio de venta** del producto puede actualizarse según el valor facturado.

#### 7.6.4 Pagos de factura (FC / OC)

**Objetivo:** registrar cobro o pago vinculado a factura.

| Paso | Acción |
|------|--------|
| 1 | Abrir la factura → Pagos / Registrar pago |
| 2 | Indicar monto (≤ saldo pendiente), método y origen (caja/banco/cheque) |
| 3 | Adjuntar soporte si aplica → Guardar |

**Asiento automático:**

| Factura | Comprobante | Efecto contable resumido |
|---------|-------------|--------------------------|
| FC | Pago | Débito proveedores / Crédito banco o caja |
| OC (cobro) | Recibo | Débito banco o caja / Crédito cartera |

No capture líneas manuales en este flujo; el sistema genera el asiento.

#### 7.6.5 Ver e imprimir factura

- **Ver:** icono de consulta en el listado.
- **PDF:** botón de descarga en la vista de detalle (si tiene permiso de visualización).

---

### 7.7 Comprobantes contables (sin factura)

**Objetivo:** registrar nómina, pagos/recibos de servicios y otros movimientos **no** ligados a una factura del módulo de facturas.

#### 7.7.1 Listar comprobantes

Menú **Comprobantes contables** → tabla con tipo, número, fecha, monto, tercero.

#### 7.7.2 Crear comprobante standalone

| Paso | Acción |
|------|--------|
| 1 | **Nuevo comprobante** |
| 2 | Tipo: `PAYROLL`, `SERVICE_PAYMENT` o `SERVICE_RECEIPT` |
| 3 | Monto, método de pago, origen (caja/banco/cheque), fecha |
| 4 | Si es **nómina:** seleccionar **empleado** (tercero rol EMPLEADO) |
| 5 | **Líneas contables de contrapartida:** agregar una o más líneas |
| 6 | En cada línea: **Tipo** (Débito/Crédito), **Cuenta** (sin 11/12), **Monto** |
| 7 | Verificar que el **neto** de líneas manuales = monto del comprobante |
| 8 | Guardar |

**Reglas de cuadre (líneas manuales):**

| Naturaleza del comprobante | Condición de cuadre |
|----------------------------|---------------------|
| Egreso (nómina, pago servicios) | Total débitos − total créditos = monto |
| Ingreso (recibo servicios) | Total créditos − total débitos = monto |

**Tesorería automática:** las cuentas **11/12** (banco/caja) **no** se capturan en líneas manuales; se generan al guardar según el método de pago indicado arriba.

#### 7.7.3 Editar o consultar

- **Ver:** modo solo lectura con todos los campos en listas desplegables.
- **Editar:** según permisos y estado del comprobante.

---

### 7.8 Productos e inventario

**Objetivo:** mantener catálogo con precios y existencias.

| Campo | Descripción |
|-------|-------------|
| Precio de compra | Referencia para FC |
| Precio de venta | Referencia para FV |
| Stock inicial / actual | Existencias (movimientos por FC/FV) |

**Pasos:** Inventario → Productos → Nuevo / Editar → completar datos → Guardar.

---

### 7.9 Activos fijos

| Función | Descripción |
|---------|-------------|
| Registro de activos | Placa, valor, vida útil, cuenta |
| Depreciación | Cálculo por periodo |
| Bajas y transferencias | Retiro o traslado |
| Kardex | Historial del activo |
| NIIF | Verificación y corrección |

---

### 7.10 Reportes contables

**Objetivo:** obtener informes por rango de fechas.

| Reporte | Uso |
|---------|-----|
| Balance de comprobación | Saldos por cuenta |
| Libro diario | Cronológico de movimientos |
| Libro mayor | Por cuenta |
| Auxiliares | Detalle analítico |
| Estados financieros | Vista agregada |

**Pasos:** seleccionar empresa (si aplica), fechas, filtros → Generar / Exportar.

---

### 7.11 Asistente con IA

**Objetivo:** orientación y consulta de indicadores de sesión.

1. Pulse el botón de chat (esquina inferior derecha).
2. Formule preguntas en lenguaje natural.

**Limitaciones:** no sustituye criterio profesional ni normativa; requiere configuración del servicio en servidor.

---

## 8. Mensajes, errores y recuperación

| Mensaje / situación | Causa probable | Acción del usuario |
|---------------------|----------------|-------------------|
| Sesión expirada | Token vencido | Volver a iniciar sesión |
| Permiso denegado | Rol sin autorización | Solicitar permiso al administrador |
| Periodo contable no abierto | Periodo cerrado | Usar fechas del periodo activo |
| El comprobante excede el total a pagar | Pagos > factura | Ajustar monto del pago |
| Neto de líneas debe igualar el monto | Asiento manual descuadrado | Revisar débitos y créditos |
| Cuenta no válida para este tipo | Cuenta fuera de filtro | Elegir cuenta de la lista permitida |
| Stock insuficiente (FV) | Cantidad > existencias | Reducir cantidad o reponer stock (FC) |
| Sin conexión | Servidor no disponible | Verificar red; avisar a soporte |

---

## 9. Seguridad, permisos y buenas prácticas

### 9.1 Permisos

- La visibilidad del menú depende de **rol** y **permisos de menú**.
- Las acciones (crear, editar, eliminar) dependen de códigos como `CREATE_VOUCHER`, `VIEW_INVOICE_FV`, etc.

### 9.2 Buenas prácticas operativas

1. No registrar movimientos en periodos cerrados.
2. Adjuntar soportes en pagos y comprobantes relevantes.
3. Conciliar bancos cada periodo.
4. Mantener datos fiscales de terceros actualizados.
5. Revisar stock tras compras (FC) y ventas (FV).

---

## 10. Soporte

Para incidencias o solicitud de permisos: administrador del sistema o equipo de desarrollo del Proyecto Integrador USCO.

Documentación complementaria: [Documentación general del proyecto](../docs/DOCUMENTACION_GENERAL.md) · [Manual de usuario](../docs/MANUAL_USUARIO.md) · [README del monorepo](../README.md)

---

## Apéndice A — Matriz de permisos frecuentes

| Código (en perfil usuario) | Acción |
|----------------------------|--------|
| `CREATE_VOUCHER` | Crear comprobante |
| `VIEW_INVOICE_FC` | Ver facturas de compra |
| `CREATE_INVOICE_FV` | Crear factura de venta |
| `UPDATE_INVOICE_FV` | Editar factura de venta |
| `CREATE_PRODUCT` | Crear producto |
| `VIEW_BANK_ACCOUNT` | Ver cuentas bancarias |

*En el servidor, Spring Security usa el prefijo `PERM_` + código.*

---

## Apéndice B — Tipos de comprobante y cuentas

| Código | Nombre | Líneas manuales | Tercero especial |
|--------|--------|-----------------|------------------|
| `PAYROLL` | Nómina | Sí (varias, D/C) | Empleado |
| `SERVICE_PAYMENT` | Pago de servicio | Sí | — |
| `SERVICE_RECEIPT` | Ingreso por servicios | Sí | — |
| `PAYMENT` | Pago (con factura FC) | No (automático) | — |
| `RECEIPT` | Recibo (con factura OC) | No (automático) | — |

**Cuentas excluidas en líneas manuales standalone:** prefijos **11** y **12** (banco/caja); se registran por método de pago.

---

*Fin del documento SIGCON-MUD-001.*
