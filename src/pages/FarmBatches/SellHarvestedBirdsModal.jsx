import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Search, Plus, UserPlus, X, Store, Truck } from "lucide-react";
import CustomerFormModal from "../Customers/CustomerFormModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SellHarvestedBirdsModal = ({
  isOpen,
  onClose,
  batchData,
  harvestSummary,
  onSuccess,
}) => {
  // Distributor selection & search state
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [distributorSearch, setDistributorSearch] = useState("");
  const [distributorResults, setDistributorResults] = useState([]);
  const [distributorLoading, setDistributorLoading] = useState(false);
  const [showDistributorResults, setShowDistributorResults] = useState(false);
  const distributorRef = useRef(null);

  // Modal for creating distributor on the fly
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalForm, setCustomerModalForm] = useState({
    name: "",
    phone: "",
    address: "",
    type: "distributor", // Default to distributor
    status: "active",
    manual_due: 0,
    manual_advance: 0,
  });
  const [customerModalLoading, setCustomerModalLoading] = useState(false);
  const [customerModalError, setCustomerModalError] = useState(null);

  // Sales form parameters
  const [weightKg, setWeightKg] = useState("");
  const [birdCount, setBirdCount] = useState("");
  const [salePricePerKg, setSalePricePerKg] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [accountList, setAccountList] = useState([]);
  const [loading, setLoading] = useState(false);

  const remainingStock = harvestSummary?.remainingWeight || 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        distributorRef.current &&
        !distributorRef.current.contains(e.target)
      ) {
        setShowDistributorResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for distributors / sales centers
  useEffect(() => {
    const delay = setTimeout(async () => {
      const q = distributorSearch.trim();
      if (!q) {
        setDistributorResults([]);
        return;
      }
      setDistributorLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/customers/search?q=${encodeURIComponent(q)}`
        );
        const data = res.data?.data || [];
        // Filter out current farmer if needed
        setDistributorResults(data.filter((c) => c._id !== batchData?.farmerId));
        setShowDistributorResults(true);
      } catch {
        setDistributorResults([]);
      } finally {
        setDistributorLoading(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [distributorSearch, batchData?.farmerId]);

  // Load payment accounts
  useEffect(() => {
    if (!isOpen) return;
    axios.get(`${API_BASE_URL}/api/payment_accounts`).then((res) => {
      const accs = res.data?.data || [];
      setAccountList(accs);
      const defaultCash = accs.find((a) => a.type === "cash" && a.is_default);
      if (defaultCash) setPaymentAccountId(defaultCash._id);
    });
  }, [isOpen]);

  const calculations = useMemo(() => {
    const weight = Number(weightKg) || 0;
    const rate = Number(salePricePerKg) || 0;
    const totalRevenue = Number((weight * rate).toFixed(2));
    const paid = Number(paidAmount) || 0;
    const due = Math.max(0, totalRevenue - paid);
    return { totalRevenue, due };
  }, [weightKg, salePricePerKg, paidAmount]);

  // Handler to register and auto-select new distributor
  const handleCreateDistributorSubmit = async (e) => {
    e.preventDefault();
    setCustomerModalLoading(true);
    setCustomerModalError(null);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/customers`,
        customerModalForm
      );
      if (res.data?.success || res.data?.data) {
        const newCustomer = res.data.data || res.data;
        toast.success("Distributor created and selected!");
        setSelectedDistributor(newCustomer);
        setIsCustomerModalOpen(false);
      } else {
        setCustomerModalError(res.data?.message || "Failed to create distributor");
      }
    } catch (err) {
      setCustomerModalError(
        err.response?.data?.message || "Server error creating distributor"
      );
    } finally {
      setCustomerModalLoading(false);
    }
  };

  // Submit Stage 2 Sale
  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (!selectedDistributor) {
      return toast.error("Please select or register a distributor/sales center.");
    }
    if (Number(weightKg) <= 0 || Number(salePricePerKg) <= 0) {
      return toast.error("Please provide valid weight and sale rate.");
    }
    if (Number(weightKg) > remainingStock) {
      return toast.error(
        `Weight exceeds remaining batch harvest stock (${remainingStock} KG).`
      );
    }

    setLoading(true);
    try {
      const payload = {
        memoNo: `INV-DIST-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        customer_id: selectedDistributor._id,
        batch_id: batchData._id,
        products: [
          {
            product_id: batchData.harvestDetails?.productId,
            name:
              batchData.harvestDetails?.productName || "Live Broiler Chicken",
            qty: Number(weightKg),
            bird_count: Number(birdCount) || 0,
            sale_price: Number(salePricePerKg),
            subtotal: calculations.totalRevenue,
          },
        ],
        total_amount: calculations.totalRevenue,
        paid_amount: Number(paidAmount) || 0,
        payment_method: Number(paidAmount) > 0 ? "cash" : "due",
        account_id:
          Number(paidAmount) > 0 && paymentAccountId ? paymentAccountId : null,
      };

      const res = await axios.post(`${API_BASE_URL}/api/sales/create`, payload);
      if (res.data?.success) {
        toast.success("Sales memo created for distributor!");
        if (typeof onSuccess === "function") onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record sale memo.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Stage 2
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Sell Birds to Distributor / Sales Center
              </h2>
              <p className="text-xs text-slate-400">
                Remaining Batch Stock: {remainingStock.toLocaleString()} KG
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitSale} className="mt-4 space-y-4 text-sm">
            {/* Distributor / Sales Center Picker with Search & +New Button */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" /> Distributor / Sales Center
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Register New
                </button>
              </div>

              {!selectedDistributor ? (
                <div className="relative" ref={distributorRef}>
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={distributorSearch}
                    onChange={(e) => setDistributorSearch(e.target.value)}
                    onFocus={() => setShowDistributorResults(true)}
                    placeholder="Search sales center by name or phone..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                  {distributorLoading && (
                    <span className="absolute right-3 top-2.5 text-[11px] text-blue-600 font-bold animate-pulse">
                      Searching...
                    </span>
                  )}

                  {showDistributorResults && distributorResults.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {distributorResults.map((d) => (
                        <li
                          key={d._id}
                          onClick={() => {
                            setSelectedDistributor(d);
                            setShowDistributorResults(false);
                            setDistributorSearch("");
                          }}
                          className="p-2.5 hover:bg-blue-50/70 cursor-pointer flex justify-between items-center transition"
                        >
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {d.name}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {d.phone || "No phone"} • {d.address || "N/A"}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {d.type || "distributor"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white border border-blue-200 p-3 rounded-xl">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">
                      {selectedDistributor.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {selectedDistributor.phone || "No phone"} •{" "}
                      {selectedDistributor.address || "No address"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDistributor(null)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-2"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Weight and Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Net Weight Sold (KG)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={remainingStock}
                  min="0.1"
                  placeholder={`Max: ${remainingStock}`}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Selling Rate (৳/KG)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  placeholder="e.g. 180"
                  value={salePricePerKg}
                  onChange={(e) => setSalePricePerKg(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-emerald-600 outline-none"
                  required
                />
              </div>
            </div>

            {/* Total Display */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase">
                  Estimated Bird Count:
                </span>
                <input
                  type="number"
                  value={birdCount}
                  onChange={(e) => setBirdCount(e.target.value)}
                  placeholder="Optional"
                  className="w-24 text-right bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none"
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-base">
                <span className="text-slate-600">Total Invoice Amount:</span>
                <span className="text-slate-900 font-mono text-xl">
                  ৳{calculations.totalRevenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Payment Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Amount Collected (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-emerald-600 outline-none"
                />
              </div>
              {Number(paidAmount) > 0 && (
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Receiving Account
                  </label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none"
                    required
                  >
                    {accountList.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.account_name || a.type}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                {loading ? "Recording..." : "Record Sale & Deduct Stock"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded Customer / Distributor Creation Modal */}
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        form={customerModalForm}
        editingId={null}
        isLoading={customerModalLoading}
        error={customerModalError}
        handleChange={(e) => {
          const { name, value } = e.target;
          setCustomerModalForm((prev) => ({ ...prev, [name]: value }));
        }}
        handleSubmit={handleCreateDistributorSubmit}
        resetForm={() => setIsCustomerModalOpen(false)}
        onCustomerSelected={(existingCustomer) => {
          setSelectedDistributor(existingCustomer);
          setIsCustomerModalOpen(false);
        }}
      />
    </>
  );
};

export default SellHarvestedBirdsModal;