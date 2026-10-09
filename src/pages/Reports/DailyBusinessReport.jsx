import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import {
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    ShoppingBag,
    Receipt,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Download,
    RefreshCw,
    Wallet,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye
} from 'lucide-react';
import TruckLoader from '../../components/Spinner/TruckLoader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DailyBusinessReport = () => {
    // --- Filter Modes: 'today' | 'daily' | 'monthly' | 'yearly' | 'range' ---
    const [filterType, setFilterType] = useState('today');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    // --- Active Tab for Data Inspection ---
    const [activeTab, setActiveTab] = useState('overview');

    // --- Dataset States ---
    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [bills, setBills] = useState([]);
    const [lending, setLending] = useState([]);
    const [borrowing, setBorrowing] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Query Object Builder aligned with /api/bills ---
    const getRequestParams = useCallback(() => {
        let params = {};
        if (filterType === 'today') {
            params.date = new Date().toISOString().split('T')[0];
        } else if (filterType === 'daily') {
            params.date = selectedDate;
        } else if (filterType === 'monthly') {
            params.month = selectedMonth; // "YYYY-MM"
        } else if (filterType === 'yearly') {
            params.year = selectedYear;
        } else if (filterType === 'range') {
            params.from = fromDate;
            params.to = toDate;
        }
        return params;
    }, [filterType, selectedDate, selectedMonth, selectedYear, fromDate, toDate]);

    // --- Client-side date filter fallback ---
    const filterByDateRange = useCallback((recordDate) => {
        if (!recordDate) return false;
        const d = new Date(recordDate);
        const recordLocalDate = d.toLocaleDateString('en-CA'); // "YYYY-MM-DD"

        if (filterType === 'today') {
            const todayStr = new Date().toLocaleDateString('en-CA');
            return recordLocalDate === todayStr;
        }
        if (filterType === 'daily') {
            return recordLocalDate === selectedDate;
        }
        if (filterType === 'monthly') {
            return recordLocalDate.startsWith(selectedMonth);
        }
        if (filterType === 'yearly') {
            return d.getFullYear() === Number(selectedYear);
        }
        if (filterType === 'range') {
            return recordLocalDate >= fromDate && recordLocalDate <= toDate;
        }
        return true;
    }, [filterType, selectedDate, selectedMonth, selectedYear, fromDate, toDate]);

    // --- Fetch All Records Concurrently ---
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        const params = getRequestParams();

        try {
            const [salesRes, purchasesRes, billsRes, lendRes, borrowRes] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/api/sales`, { params }),
                axios.get(`${API_BASE_URL}/api/purchases`, { params }),
                axios.get(`${API_BASE_URL}/api/bills`, { params }), // ✅ Query /api/bills directly
                axios.get(`${API_BASE_URL}/api/lend-money`),
                axios.get(`${API_BASE_URL}/api/borrow-money`)
            ]);

            // Sales Normalization
            const rawSales = salesRes.status === 'fulfilled' ? (salesRes.value.data?.data || salesRes.value.data || []) : [];
            setSales(rawSales.filter((s) => filterByDateRange(s.date || s.createdAt)));

            // Purchases Normalization
            const rawPurchases = purchasesRes.status === 'fulfilled' ? (purchasesRes.value.data?.data || purchasesRes.value.data || []) : [];
            setPurchases(rawPurchases.filter((p) => filterByDateRange(p.date || p.createdAt)));

            // Bills (Expenses) Normalization
            const rawBills = billsRes.status === 'fulfilled' ? (billsRes.value.data?.data || billsRes.value.data || []) : [];
            setBills(rawBills.filter((b) => filterByDateRange(b.billDate || b.createdAt || b.date)));

            // Lending Normalization
            const rawLending = lendRes.status === 'fulfilled' ? (lendRes.value.data?.data || lendRes.value.data || []) : [];
            setLending(rawLending.filter((l) => filterByDateRange(l.date || l.createdAt)));

            // Borrowing Normalization
            const rawBorrow = borrowRes.status === 'fulfilled' ? (borrowRes.value.data?.data || borrowRes.value.data || []) : [];
            setBorrowing(rawBorrow.filter((b) => filterByDateRange(b.date || b.createdAt)));

        } catch (err) {
            console.error("Dashboard fetch error:", err);
            toast.error("Error synchronizing period data.");
        } finally {
            setLoading(false);
        }
    }, [getRequestParams, filterByDateRange]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // --- Aggregated Summaries & Metrics ---
    const metrics = useMemo(() => {
        // Sales
        const totalSales = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
        const salesCollected = sales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
        const salesDue = sales.reduce((sum, s) => sum + Number(s.due_amount || (s.total_amount - s.paid_amount) || 0), 0);

        // Purchases
        const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
        const purchasesPaid = purchases.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
        const purchasesDue = purchases.reduce((sum, p) => sum + Number(p.payment_due || (p.total_amount - p.paid_amount) || 0), 0);

        // Shop Expenses (Bills)
        const totalExpenses = bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);

        // Lending & Advance
        const totalLent = lending.reduce((sum, l) => sum + Number(l.amount || 0), 0);
        const lendingRepaymentsReceived = lending.reduce((sum, l) => sum + Number(l.repaid_amount || 0), 0);

        // Borrowing
        const totalBorrowed = borrowing.reduce((sum, b) => sum + Number(b.amount || 0), 0);
        const borrowRepaymentsPaid = borrowing.reduce((sum, b) => sum + Number(b.repaid_amount || 0), 0);

        // Cash Flow Math:
        // Cash In = Sales Cash Received + Outside Borrowing + Repayments Collected from Lending
        const cashInflows = salesCollected + totalBorrowed + lendingRepaymentsReceived;

        // Cash Out = Purchases Cash Paid + Shop Expenses (Bills) + Loans Disbursed + Debt Repayments Made
        const cashOutflows = purchasesPaid + totalExpenses + totalLent + borrowRepaymentsPaid;

        const netCashFlow = cashInflows - cashOutflows;
        const grossMargin = totalSales - totalPurchases - totalExpenses;

        return {
            totalSales,
            salesCollected,
            salesDue,
            totalPurchases,
            purchasesPaid,
            purchasesDue,
            totalExpenses,
            totalLent,
            lendingRepaymentsReceived,
            totalBorrowed,
            borrowRepaymentsPaid,
            cashInflows,
            cashOutflows,
            netCashFlow,
            grossMargin
        };
    }, [sales, purchases, bills, lending, borrowing]);

    // --- Excel Comprehensive Export ---
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();

        // 1. Summary Sheet
        const summaryData = [
            { Metric: "Total Sales Invoiced", Amount: metrics.totalSales },
            { Metric: "Sales Cash Received", Amount: metrics.salesCollected },
            { Metric: "Sales Accounts Receivable (Due)", Amount: metrics.salesDue },
            { Metric: "Total Purchases Ordered", Amount: metrics.totalPurchases },
            { Metric: "Purchases Cash Paid", Amount: metrics.purchasesPaid },
            { Metric: "Purchases Accounts Payable (Due)", Amount: metrics.purchasesDue },
            { Metric: "Shop Daily Expenses (Bills)", Amount: metrics.totalExpenses },
            { Metric: "New Money Borrowed (Inflow)", Amount: metrics.totalBorrowed },
            { Metric: "New Loans Lent Out (Outflow)", Amount: metrics.totalLent },
            { Metric: "Net Period Cash Flow", Amount: metrics.netCashFlow },
            { Metric: "Estimated Operational Margin", Amount: metrics.grossMargin },
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

        // 2. Sales Sheet
        if (sales.length > 0) {
            const salesData = sales.map((s) => ({
                Date: s.date ? format(new Date(s.date), "yyyy-MM-dd") : 'N/A',
                Customer: s.customer_name || 'Walk-in',
                Invoice: s.memo_no || s._id,
                Total: s.total_amount || 0,
                Paid: s.paid_amount || 0,
                Due: (s.total_amount || 0) - (s.paid_amount || 0),
                Method: s.payment_method || 'N/A'
            }));
            const wsSales = XLSX.utils.json_to_sheet(salesData);
            XLSX.utils.book_append_sheet(wb, wsSales, "Sales");
        }

        // 3. Purchases Sheet
        if (purchases.length > 0) {
            const purchaseData = purchases.map((p) => ({
                Date: p.date ? format(new Date(p.date), "yyyy-MM-dd") : 'N/A',
                Supplier: p.supplier_name || 'N/A',
                Total: p.total_amount || 0,
                Paid: p.paid_amount || 0,
                Due: p.payment_due || 0,
                Method: p.payment_method || 'N/A'
            }));
            const wsPurchases = XLSX.utils.json_to_sheet(purchaseData);
            XLSX.utils.book_append_sheet(wb, wsPurchases, "Purchases");
        }

        // 4. Expenses (Bills) Sheet
        if (bills.length > 0) {
            const expenseData = bills.map((b) => ({
                Date: b.createdAt || b.billDate ? format(new Date(b.createdAt || b.billDate), "yyyy-MM-dd") : 'N/A',
                Category: b.expenseThreadName || b.expenseThreadId?.name || 'Overhead',
                Purpose: b.billName || 'N/A',
                Payee: b.payeeName || b.payee || 'Direct Expense',
                PaymentFrom: b.payment_details?.payment_method || b.paymentAc || 'Cash',
                Amount: b.amount || 0
            }));
            const wsBills = XLSX.utils.json_to_sheet(expenseData);
            XLSX.utils.book_append_sheet(wb, wsBills, "Expenses (Bills)");
        }

        XLSX.writeFile(wb, `ModernPoultry_Report_${filterType}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    };

    if (loading) return <TruckLoader />;

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-7xl font-sans text-slate-700 min-h-screen">
            {/* Top Bar Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                            <Wallet className="w-7 h-7" />
                        </span>
                        Daily & Period Business Summary
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Consolidated position of Sales, Purchases, Shop Daily Expenses (Bills), and Financing[cite: 1]
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <button
                        onClick={fetchAllData}
                        className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition text-sm"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm text-sm"
                    >
                        <Download className="w-4 h-4" /> Export Excel
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Period Buttons */}
                    <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                        {[
                            { id: 'today', label: 'Today' },
                            { id: 'daily', label: 'Pick Date' },
                            { id: 'monthly', label: 'Monthly' },
                            { id: 'yearly', label: 'Yearly' },
                            { id: 'range', label: 'Custom Range' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setFilterType(btn.id)}
                                className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                                    filterType === btn.id
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Date Pickers */}
                    <div className="flex items-center gap-3">
                        {filterType === 'daily' && (
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
                                />
                            </div>
                        )}

                        {filterType === 'monthly' && (
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
                                />
                            </div>
                        )}

                        {filterType === 'yearly' && (
                            <input
                                type="number"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-28 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none"
                            />
                        )}

                        {filterType === 'range' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none"
                                />
                                <span className="text-slate-400 text-xs font-bold uppercase">To</span>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* High-Level Financial Snapshot Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Net Cash Flow */}
                <div className={`p-6 rounded-2xl border-l-4 shadow-sm bg-white ${
                    metrics.netCashFlow >= 0 ? 'border-emerald-500' : 'border-rose-500'
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Net Cash Position</span>
                        <span className={`p-2 rounded-xl ${metrics.netCashFlow >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {metrics.netCashFlow >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </span>
                    </div>
                    <p className={`text-2xl font-black mt-2 ${metrics.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ৳{metrics.netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        In (৳{metrics.cashInflows.toLocaleString()}) - Out (৳{metrics.cashOutflows.toLocaleString()})
                    </p>
                </div>

                {/* Sales */}
                <div className="bg-white p-6 rounded-2xl border-l-4 border-blue-500 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Sales Invoiced</span>
                        <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <ShoppingCart className="w-5 h-5" />
                        </span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">
                        ৳{metrics.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex justify-between text-xs mt-2 text-slate-500 font-medium">
                        <span>Paid: <b className="text-emerald-600">৳{metrics.salesCollected.toLocaleString()}</b></span>
                        <span>Due: <b className="text-rose-600">৳{metrics.salesDue.toLocaleString()}</b></span>
                    </div>
                </div>

                {/* Purchases */}
                <div className="bg-white p-6 rounded-2xl border-l-4 border-amber-500 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Purchases</span>
                        <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                            <ShoppingBag className="w-5 h-5" />
                        </span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">
                        ৳{metrics.totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex justify-between text-xs mt-2 text-slate-500 font-medium">
                        <span>Paid: <b className="text-emerald-600">৳{metrics.purchasesPaid.toLocaleString()}</b></span>
                        <span>Due: <b className="text-rose-600">৳{metrics.purchasesDue.toLocaleString()}</b></span>
                    </div>
                </div>

                {/* Expenses (Bills) */}
                <div className="bg-white p-6 rounded-2xl border-l-4 border-purple-500 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Daily Expenses (Bills)</span>
                        <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                            <Receipt className="w-5 h-5" />
                        </span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">
                        ৳{metrics.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{bills.length} bills / expense vouchers</p>
                </div>
            </div>

            {/* Secondary Financing Row (Lending & Borrowing) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                {/* Lending Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lending & Staff Advances</span>
                            <p className="text-lg font-bold text-slate-900">Disbursed: ৳{metrics.totalLent.toLocaleString()}</p>
                            <p className="text-xs text-emerald-600 font-semibold">Repaid Back: ৳{metrics.lendingRepaymentsReceived.toLocaleString()}</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold bg-teal-50 text-teal-700 px-3 py-1.5 rounded-xl border border-teal-200">
                        {lending.length} Records
                    </span>
                </div>

                {/* Borrowing Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <ArrowDownLeft className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Borrowing & Loans Inflow</span>
                            <p className="text-lg font-bold text-slate-900">Borrowed: ৳{metrics.totalBorrowed.toLocaleString()}</p>
                            <p className="text-xs text-rose-600 font-semibold">Debt Repaid: ৳{metrics.borrowRepaymentsPaid.toLocaleString()}</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-200">
                        {borrowing.length} Records
                    </span>
                </div>
            </div>

            {/* Navigation Tabs for Detailed Ledgers */}
            <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Cash Flow Breakdown', count: null },
                    { id: 'sales', label: 'Sales Records', count: sales.length },
                    { id: 'purchases', label: 'Purchase Records', count: purchases.length },
                    { id: 'bills', label: 'Daily Expenses (Bills)', count: bills.length },
                    { id: 'financing', label: 'Lending & Borrowing', count: lending.length + borrowing.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        {tab.label}
                        {tab.count !== null && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* TAB 1: CONSOLIDATED BREAKDOWN */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                            Cash Inflow Channels
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm font-medium text-slate-700">Sales Cash / Bank Receipts</span>
                                <span className="font-bold text-emerald-600">৳{metrics.salesCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm font-medium text-slate-700">Outside Loans Borrowed</span>
                                <span className="font-bold text-emerald-600">৳{metrics.totalBorrowed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm font-medium text-slate-700">Lending Loan Returns Received</span>
                                <span className="font-bold text-emerald-600">৳{metrics.lendingRepaymentsReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-emerald-50 text-emerald-900 rounded-xl font-bold border border-emerald-200">
                                <span>Total Cash Inflow</span>
                                <span>৳{metrics.cashInflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                            Cash Outflow Channels
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm font-medium text-slate-700">Purchases Disbursed</span>
                                <span className="font-bold text-rose-600">৳{metrics.purchasesPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm font-medium text-slate-700">Shop Daily Expenses (Bills)</span>
                                <span className="font-bold text-rose-600">৳{metrics.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm font-medium text-slate-700">Advances / Loans Lent Out</span>
                                <span className="font-bold text-rose-600">৳{metrics.totalLent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm font-medium text-slate-700">Borrow Repayments Paid Back</span>
                                <span className="font-bold text-rose-600">৳{metrics.borrowRepaymentsPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-rose-50 text-rose-900 rounded-xl font-bold border border-rose-200">
                                <span>Total Cash Outflow</span>
                                <span>৳{metrics.cashOutflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: SALES TABLE */}
            {activeTab === 'sales' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Date</th>
                                    <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Customer</th>
                                    <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Method</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Total (৳)</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Paid (৳)</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Due (৳)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {sales.map((s, idx) => (
                                    <tr key={s._id || idx} className="hover:bg-slate-50/70">
                                        <td className="px-5 py-3.5 font-medium text-slate-800">
                                            {s.date ? format(new Date(s.date), "dd MMM yyyy, p") : "-"}
                                        </td>
                                        <td className="px-5 py-3.5 font-bold text-slate-900">{s.customer_name || 'Walk-in'}</td>
                                        <td className="px-5 py-3.5 uppercase text-xs font-semibold text-slate-500">{s.payment_method || 'CASH'}</td>
                                        <td className="px-5 py-3.5 text-right font-bold text-slate-900">৳{s.total_amount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-right font-bold text-emerald-600">৳{s.paid_amount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-right font-bold text-rose-600">
                                            ৳{(Number(s.total_amount || 0) - Number(s.paid_amount || 0)).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {sales.length === 0 && (
                        <div className="p-12 text-center text-slate-400 italic">No sales recorded for this timeframe.</div>
                    )}
                </div>
            )}

            {/* TAB 3: PURCHASES TABLE */}
            {activeTab === 'purchases' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Date</th>
                                    <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Supplier</th>
                                    <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Method</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Total (৳)</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Paid (৳)</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Due (৳)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {purchases.map((p, idx) => (
                                    <tr key={p._id || idx} className="hover:bg-slate-50/70">
                                        <td className="px-5 py-3.5 font-medium text-slate-800">
                                            {p.date ? format(new Date(p.date), "dd MMM yyyy, p") : "-"}
                                        </td>
                                        <td className="px-5 py-3.5 font-bold text-slate-900">{p.supplier_name || 'Walk-in'}</td>
                                        <td className="px-5 py-3.5 uppercase text-xs font-semibold text-slate-500">{p.payment_method || 'CASH'}</td>
                                        <td className="px-5 py-3.5 text-right font-bold text-slate-900">৳{p.total_amount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-right font-bold text-emerald-600">৳{p.paid_amount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-right font-bold text-rose-600">৳{(p.payment_due || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {purchases.length === 0 && (
                        <div className="p-12 text-center text-slate-400 italic">No purchases recorded for this timeframe.</div>
                    )}
                </div>
            )}

            {/* TAB 4: BILLS (EXPENSES) TABLE */}
            {activeTab === 'bills' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Date</th>
                                    <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Expense Purpose</th>
                                    <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Expense Head</th>
                                    <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Paid To</th>
                                    <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Paid From</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Amount (৳)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {bills.map((b, idx) => (
                                    <tr key={b._id || idx} className="hover:bg-slate-50/70">
                                        <td className="px-5 py-3.5 font-medium text-slate-800">
                                            {b.createdAt || b.billDate ? format(new Date(b.createdAt || b.billDate), "dd MMM yyyy") : "-"}
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                                            {b.billName}
                                            {b.remarks && <span className="block text-xs font-normal text-slate-400">{b.remarks}</span>}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
                                                {b.expenseThreadName || b.expenseThreadId?.name || 'Overhead'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">{b.payeeName || b.payee || 'Direct Expense'}</td>
                                        <td className="px-5 py-3.5 uppercase text-xs font-medium text-slate-500">
                                            {b.payment_details?.payment_method || b.paymentAc || 'CASH'}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-bold text-purple-600">
                                            ৳{Number(b.amount || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {bills.length === 0 && (
                        <div className="p-12 text-center text-slate-400 italic">No expense bills recorded for this timeframe.</div>
                    )}
                </div>
            )}

            {/* TAB 5: FINANCING (LENDING & BORROWING) */}
            {activeTab === 'financing' && (
                <div className="space-y-6">
                    {/* Lending Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Lending & Staff Advances</h3>
                            <span className="text-xs bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded-full">
                                {lending.length} Records
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Date</th>
                                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Borrower</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Lent (৳)</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Repaid (৳)</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Due (৳)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {lending.map((l, idx) => (
                                        <tr key={l._id || idx}>
                                            <td className="px-5 py-3 font-medium text-slate-800">{l.date ? format(new Date(l.date), "dd MMM yyyy") : "-"}</td>
                                            <td className="px-5 py-3 font-bold text-slate-900">{l.borrower_name}</td>
                                            <td className="px-5 py-3 text-right font-bold text-slate-900">৳{Number(l.amount || 0).toLocaleString()}</td>
                                            <td className="px-5 py-3 text-right font-bold text-emerald-600">৳{Number(l.repaid_amount || 0).toLocaleString()}</td>
                                            <td className="px-5 py-3 text-right font-bold text-rose-600">৳{Number(l.due_amount || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Borrowing Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Borrowing & Outside Capital</h3>
                            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full">
                                {borrowing.length} Records
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Date</th>
                                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Lender</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Borrowed (৳)</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Repaid (৳)</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Remaining Due (৳)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {borrowing.map((b, idx) => (
                                        <tr key={b._id || idx}>
                                            <td className="px-5 py-3 font-medium text-slate-800">{b.date ? format(new Date(b.date), "dd MMM yyyy") : "-"}</td>
                                            <td className="px-5 py-3 font-bold text-slate-900">{b.lender_name || b.name}</td>
                                            <td className="px-5 py-3 text-right font-bold text-slate-900">৳{Number(b.amount || 0).toLocaleString()}</td>
                                            <td className="px-5 py-3 text-right font-bold text-rose-600">৳{Number(b.repaid_amount || 0).toLocaleString()}</td>
                                            <td className="px-5 py-3 text-right font-bold text-amber-600">৳{Number(b.due_amount || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyBusinessReport;