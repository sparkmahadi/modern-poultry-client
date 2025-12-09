import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router';
import {
  MapPin,
  Phone,
  CheckCircle,
  XOctagon,
  Tag,
  Truck,
  Clock,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle
} from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/suppliers`;

const formatBalance = (due, advance) => {
  const balance = due - advance;
  const absBalance = Math.abs(balance).toFixed(2);

  if (balance > 0) return { label: `Payable: ৳${absBalance}`, className: 'text-red-600 bg-red-50 border-red-200', icon: ArrowUpCircle };
  if (balance < 0) return { label: `Receivable: ৳${absBalance}`, className: 'text-green-600 bg-green-50 border-green-200', icon: ArrowDownCircle };
  return { label: 'Settled', className: 'text-gray-600 bg-gray-50 border-gray-200', icon: DollarSign };
};

const formatDate = (dateObject) => {
  if (!dateObject || !dateObject.$date) return 'N/A';
  return new Date(dateObject.$date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const DetailRow = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`flex items-start space-x-3 p-3 ${className}`}>
    <Icon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-900 break-words">{value}</p>
    </div>
  </div>
);

const SupplierDetails = () => {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("Supplier ID is missing from the URL.");
      setIsLoading(false);
      return;
    }

    const fetchSupplier = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/${id}`);
        setSupplier(res.data.data || res.data);
      } catch (err) {
        console.error("Fetch error:", err);
        if (err.response?.status === 404) setError(`Supplier with ID "${id}" was not found.`);
        else setError("Failed to fetch supplier details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [id]);

  if (isLoading) return <div className="text-center p-10 bg-white rounded-xl shadow-lg"><Truck className="w-8 h-8 mx-auto text-blue-500 animate-spin" /><p className="mt-2 text-lg text-gray-700">Loading supplier data...</p></div>;
  if (error) return <div className="p-6 bg-red-100 border-l-4 border-red-500 rounded-xl shadow-lg text-red-800"><div className="flex items-center space-x-3"><AlertTriangle className="w-6 h-6 flex-shrink-0" /><p className="font-bold text-lg">Error Loading Data:</p></div><p className="ml-9 mt-1">{error}</p></div>;

  const balanceInfo = formatBalance(supplier.due, supplier.advance);
  const StatusIcon = supplier.status === 'active' ? CheckCircle : XOctagon;
  const commaSpaceSeparatedString = supplier?.supplied_products?.join(", ");

  const getTransactionStatus = (due) => {
    if (due > 0) return { label: 'Payable', className: 'bg-red-100 text-red-700' };
    if (due < 0) return { label: 'Receivable', className: 'bg-green-100 text-green-700' };
    return { label: 'Settled', className: 'bg-gray-100 text-gray-700' };
  };

  // Calculate total payable and receivable from supplier_history
  const totalPayable = supplier.supplier_history?.reduce((sum, tx) => tx.due_after_payment > 0 ? sum + tx.due_after_payment : sum, 0) || 0;
  const totalReceivable = supplier.supplier_history?.reduce((sum, tx) => tx.due_after_payment < 0 ? sum + Math.abs(tx.due_after_payment) : sum, 0) || 0;

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-6xl mx-auto">
      {/* Header */}
      <header className="border-b pb-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center space-x-3">
          <Truck className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-extrabold text-gray-900">{supplier.name} Details</h1>
        </div>
        <span className={`px-4 py-2 mt-3 sm:mt-0 text-sm font-bold rounded-full capitalize ${supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <StatusIcon className="w-4 h-4 inline mr-1" />
          {supplier.status}
        </span>
      </header>

      {/* Financial Status */}
      <div className={`p-4 rounded-lg mb-4 border-2 ${balanceInfo.className}`}>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">Current Balance</p>
          <p className="text-3xl font-extrabold">{balanceInfo.label}</p>
        </div>
        <p className="text-xs text-right mt-1 opacity-90">(Payable: ৳{supplier.due.toFixed(2)} / Receivable: ৳{supplier.advance.toFixed(2)})</p>
      </div>

      {/* Total Payable / Receivable Summary */}
      <div className="flex space-x-4 mb-6">
        <div className="p-4 flex-1 border rounded-lg bg-red-50 text-red-700 font-semibold text-center">
          Total Payable: ৳{totalPayable.toFixed(2)}
        </div>
        <div className="p-4 flex-1 border rounded-lg bg-green-50 text-green-700 font-semibold text-center">
          Total Receivable: ৳{totalReceivable.toFixed(2)}
        </div>
      </div>

      {/* Contact & Info */}
      <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-1">Contact & Basic Info</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pb-4 mb-4">
        <DetailRow icon={Phone} label="Phone / Contact" value={supplier.phone || 'N/A'} />
        <DetailRow icon={Tag} label="Supplier Type" value={supplier.type ? supplier.type.charAt(0).toUpperCase() + supplier.type.slice(1) : 'N/A'} />
        <DetailRow icon={MapPin} label="Address" value={supplier.address || 'N/A'} className="md:col-span-2" />
      </div>

      {/* Metadata */}
      <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-1">System Metadata</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <DetailRow icon={Clock} label="Record Created" value={formatDate(supplier.createdAt)} />
        <DetailRow icon={Clock} label="Last Updated" value={formatDate(supplier.updatedAt)} />
        <DetailRow icon={DollarSign} label="Database ID" value={supplier._id?.$oid || 'N/A'} />
        <DetailRow icon={DollarSign} label="Supplied Products" value={commaSpaceSeparatedString || 'N/A'} />
      </div>

      {/* Supplier Transaction History */}
      <h2 className="text-xl font-bold text-gray-800 mt-6 mb-2 border-b pb-1">Supplier Transaction History</h2>
      {supplier.supplier_history?.length ? (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Products</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Total Amount</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Paid Amount</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Due After Payment</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {supplier.supplier_history.map((history, idx) => {
                const txnStatus = getTransactionStatus(history.due_after_payment);
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-700">{formatDate(history.date)}</td>
                    <td className="px-4 py-2 text-sm text-gray-700 capitalize">{history.type.replace('_', ' ')}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{history.products.map(p => `${p.name} x${p.qty}`).join(', ')}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">৳{history.total_amount}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">৳{history.paid_amount}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">৳{history.due_after_payment}</td>
                    <td className="px-4 py-2 text-sm"><span className={`px-2 py-1 text-xs font-semibold rounded ${txnStatus.className}`}>{txnStatus.label}</span></td>
                    <td className="px-4 py-2 text-sm text-gray-700">{history.remarks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 italic">No transactions found for this supplier.</p>
      )}
    </div>
  );
};

export default SupplierDetails;
