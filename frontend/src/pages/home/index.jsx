import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { base_url, formatPrice } from "../../utils/functions";
import { fetchHelper } from "../../utils/fetch";

const Home = () => {
    const user = useSelector(state => state.user).user;
    const currency = user?.company?.currencyType?.isoCode ?? "COP";

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError("");
                const url = base_url(["api", "v1", "dashboard", "overview"]);
                const response = await fetchHelper.get(url, {}, 0, true);
                if (!mounted) return;
                setDashboard(response?.data ?? null);
            } catch (err) {
                if (!mounted) return;
                setError(err?.msg || err?.message || "No fue posible cargar el dashboard.");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadDashboard();
        return () => {
            mounted = false;
        };
    }, []);

    const indicators = dashboard?.indicators ?? {};
    const isSuperAdminView = dashboard?.scope === "GLOBAL";

    const kpiCards = useMemo(() => {
        const cards = [
            { label: "Facturas", value: indicators.totalInvoices ?? 0, color: "primary" },
            { label: "Comprobantes", value: indicators.totalVouchers ?? 0, color: "info" },
            { label: "Activos", value: indicators.totalAssets ?? 0, color: "success" },
            { label: "Cuentas bancarias", value: indicators.totalBankAccounts ?? 0, color: "warning" },
            { label: "Usuarios", value: indicators.totalUsers ?? 0, color: "secondary" },
        ];

        if (isSuperAdminView) {
            cards.unshift({
                label: "Empresas activas",
                value: indicators.totalCompanies ?? 0,
                color: "dark",
            });
        }
        return cards;
    }, [indicators, isSuperAdminView]);

    return (
        <div className="container-fluid">
            <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">
                <div>
                    <h4 className="mb-1">Dashboard</h4>
                    <p className="text-muted mb-0">
                        Hola <b>{user?.name ?? ""} {user?.lastname ?? ""}</b>, estás viendo{" "}
                        <b>{dashboard?.companyName ?? "tu empresa"}</b>.
                    </p>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {loading && !dashboard && (
                <div className="card">
                    <div className="card-body py-5 text-center text-muted">Cargando indicadores del dashboard...</div>
                </div>
            )}

            {!loading && dashboard && (
                <>
                    <div className="row g-3 mb-2">
                        {kpiCards.map((card) => (
                            <div key={card.label} className="col-12 col-md-6 col-xl-2">
                                <div className={`card border-${card.color} border-opacity-25 h-100`}>
                                    <div className="card-body">
                                        <p className="text-muted mb-1">{card.label}</p>
                                        <h5 className="mb-0">{Number(card.value || 0).toLocaleString("es-CO")}</h5>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="row g-3 mb-3">
                        <div className="col-12 col-lg-6">
                            <div className="card h-100">
                                <div className="card-body">
                                    <p className="text-muted mb-1">Total facturado</p>
                                    <h4 className="mb-0">
                                        {formatPrice(Number(indicators.totalInvoiceAmount || 0), currency, "es-CO", 0)}
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-lg-6">
                            <div className="card h-100">
                                <div className="card-body">
                                    <p className="text-muted mb-1">Total en comprobantes</p>
                                    <h4 className="mb-0">
                                        {formatPrice(Number(indicators.totalVoucherAmount || 0), currency, "es-CO", 0)}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-3">
                        <ChartBars
                            title="Comprobantes por mes (6 meses)"
                            items={dashboard.vouchersByMonth}
                            currency={currency}
                            colorClass="bg-info"
                        />
                        <ChartBars
                            title="Facturación por mes (6 meses)"
                            items={dashboard.invoicesByMonth}
                            currency={currency}
                            colorClass="bg-primary"
                        />
                    </div>

                    {isSuperAdminView && (
                        <div className="row g-3 mt-1">
                            <RankingBars
                                title="Top empresas por facturación"
                                items={dashboard.topCompaniesByInvoiceAmount}
                                currency={currency}
                                colorClass="bg-success"
                            />
                            <RankingBars
                                title="Top empresas por comprobantes"
                                items={dashboard.topCompaniesByVoucherAmount}
                                currency={currency}
                                colorClass="bg-warning"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const ChartBars = ({ title, items = [], currency, colorClass = "bg-primary" }) => {
    const max = Math.max(...items.map((item) => Number(item?.amount || 0)), 1);

    return (
        <div className="col-12 col-xl-6">
            <div className="card h-100">
                <div className="card-body">
                    <h6 className="card-title mb-3">{title}</h6>
                    {items.length === 0 ? (
                        <p className="text-muted mb-0">Sin información.</p>
                    ) : (
                        items.map((item) => {
                            const value = Number(item?.amount || 0);
                            const percent = Math.max((value / max) * 100, 2);
                            return (
                                <div key={item.month} className="mb-3">
                                    <div className="d-flex justify-content-between">
                                        <small className="text-muted">{item.month}</small>
                                        <small className="fw-semibold">
                                            {formatPrice(value, currency, "es-CO", 0)}
                                        </small>
                                    </div>
                                    <div className="progress mt-1" style={{ height: 8 }}>
                                        <div className={`progress-bar ${colorClass}`} style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const RankingBars = ({ title, items = [], currency, colorClass = "bg-success" }) => {
    const max = Math.max(...items.map((item) => Number(item?.totalAmount || 0)), 1);
    return (
        <div className="col-12 col-xl-6">
            <div className="card h-100">
                <div className="card-body">
                    <h6 className="card-title mb-3">{title}</h6>
                    {items.length === 0 ? (
                        <p className="text-muted mb-0">Sin información.</p>
                    ) : (
                        items.map((item) => {
                            const value = Number(item?.totalAmount || 0);
                            const percent = Math.max((value / max) * 100, 2);
                            return (
                                <div key={item.companyId} className="mb-3">
                                    <div className="d-flex justify-content-between">
                                        <small className="text-muted">{item.companyName}</small>
                                        <small className="fw-semibold">
                                            {formatPrice(value, currency, "es-CO", 0)}
                                        </small>
                                    </div>
                                    <div className="progress mt-1" style={{ height: 8 }}>
                                        <div className={`progress-bar ${colorClass}`} style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;