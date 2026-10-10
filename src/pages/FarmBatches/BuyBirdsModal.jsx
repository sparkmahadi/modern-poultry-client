import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShoppingCart, Scale, DollarSign, X, CheckCircle2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BuyBirdsModal = ({ isOpen, onClose, batchData, farmerData, onSuccess }) => {
  const [birdCount, setBirdCount] = useState(batchData?.chicksQuantity || 0);
  const [totalWeightKg, setTotalWeightKg] = useState("");
  const [purchaseRatePerKg, setPurchaseRatePerKg] = useState("");
  const [productId, setProductId] = useState("");
  const [productsList, setProductsList] = useState([]);
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split("T")[0]);
  const [offsetFarmerDue, setOffsetFarmerDue] = useState(true);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [accountList, setAccountList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load available bird products and payment accounts
    Promise.allSettled([
      axios.get(`${API_BASE_URL}/api/products`),
      axios.get(`${API_BASE_URL}/api/payment_accounts`)
    ]).then(([prodRes, accRes]) => {
      if (prodRes.status === "fulfilled") {
        const prods = prodRes.value.data?.data || [];
        const birds = prods.filter(p =>
          p.category?.toLowerCase().includes("bird") ||
          p.item_name?.toLowerCase().includes("chicken") ||
          p.item_name?.toLowerCase().includes("broiler")
        );
        setProductsList(birds.length ? birds : prods);
        if (birds.length) setProductId(birds[0]._id);
      }
      if (accRes.status === "fulfilled") {
        const accs = accRes.value.data?.data || [];
        setAccountList(accs);
        const defaultCash = accs.find(a => a.type === "cash" && a.is_default);
        if (defaultCash) setPaymentAccountId(defaultCash._id);
      }
    });
  }, [isOpen]);

  const calculations = useMemo(() => {
    const weight = Number(totalWeightKg) || 0;
    const rate = Number(purchaseRatePerKg) || 0;
    const count = Number(birdCount) || 0;
    const totalCost = Number((weight * rate).toFixed(2));
    const avgWeight = count > 0 ? (weight / count).toFixed(2) : 0;
    const balanceRemaining = Math.max(0, totalCost - Number(paidAmount || 0));

    return { totalCost, avgWeight, balanceRemaining };
  }, [totalWeightKg, purchaseRatePerKg, birdCount, paidAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!totalWeightKg || !purchaseRatePerKg) {
      return toast.error("Please enter weight and purchase rate.");
    }
    if (!productId) {
      return toast.error("Please select a live bird inventory item.");
    }

    setLoading(true);
    try {
      const selectedProd = productsList.find(p => p._id === productId);
      const payload = {
        birdCount: Number(birdCount),
        totalWeightKg: Number(totalWeightKg),
        purchaseRatePerKg: Number(purchaseRatePerKg),
        productId,
        productName: selectedProd?.item_name || "Live Broiler Chicken",
        harvestDate,
        offsetFarmerDue,
        paidAmount: Number(paidAmount) || 0,
        paymentAccountId: Number(paidAmount) > 0 ? paymentAccountId : null,
      };

      const res = await axios.post(`${API_BASE_URL}/api/batches/${batchData._id}/buy-birds`, payload);
      if (res.data?.success) {
        toast.success("Stage 1 Complete: Birds purchased & stocked in inventory!");
        if (typeof onSuccess === "function") onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process bird buyback.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Stage 1
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Buy Mature Birds from {batchData?.farmer}
            </h2>
            <p className="text-xs text-slate-400">Stock live birds into inventory before dealer distribution</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          {/* Inventory Item Selection */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
              Inventory Product Target
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none"
              required
            >
              {productsList.map(p => (
                <option key={p._id} value={p._id}>{p.item_name} ({p.unit || "KG"})</option>
              ))}
            </select>
          </div>

          {/* Bird Count & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Bird Count</label>
              <input
                type="number"
                min="1"
                value={birdCount}
                onChange={(e) => setBirdCount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Total Weight (KG)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                placeholder="e.g. 3500"
                value={totalWeightKg}
                onChange={(e) => setTotalWeightKg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-emerald-700"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Avg Body Weight</label>
              <div className="p-2 bg-slate-100 rounded-xl font-bold text-slate-700 text-center">
                {calculations.avgWeight} kg
              </div>
            </div>
          </div>

          {/* Pricing & Cost */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Purchase Rate (৳/KG) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  placeholder="e.g. 165"
                  value={purchaseRatePerKg}
                  onChange={(e) => setPurchaseRatePerKg(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-rose-600"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Harvest Date</label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-base">
              <span className="text-slate-600">Total Purchase Cost:</span>
              <span className="text-slate-900 font-mono text-xl">
                ৳{calculations.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Settlement / Offset Debt */}
          <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-white">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={offsetFarmerDue}
                onChange={(e) => setOffsetFarmerDue(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-xs font-bold text-slate-700">
                Offset purchase payout against {batchData?.farmer}'s existing feed/medicine dues
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Direct Cash Paid (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold"
                />
              </div>
              {Number(paidAmount) > 0 && (
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Payment Channel</label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                    required
                  >
                    {accountList.map(a => (
                      <option key={a._id} value={a._id}>{a.account_name || a.type}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
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
              {loading ? "Processing..." : "Complete Stage 1: Stock into Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuyBirdsModal;