import { useState, useMemo, useEffect } from "react";
import { toast } from 'react-toastify';
import { purchaseService } from "./purchaseService";

const initialFormState = {
  supplier_name: "", address: "", phone: "", due: 0, advance: 0,
  status: "pending", supplierId: null, paid_amount: 0,
  payment_method: "", account_id: null
};

export const usePurchaseLogic = () => {
  const [form, setForm] = useState(initialFormState);
  const [products, setProducts] = useState([]);
  const [dateTime, setDateTime] = useState("");
  
  // UI States
  const [supplierSearch, setSupplierSearch] = useState({ query: "", results: [], loading: false });
  const [productSearch, setProductSearch] = useState({ query: "", results: [], loading: false });
  const [modals, setModals] = useState({ product: false, supplier: false, payment: false });
  const [apiStates, setApiStates] = useState({ submitting: false, supplierLoading: false, productLoading: false });
  const [categories, setCategories] = useState([]);
  const [accountList, setAccountList] = useState([]);

  // Init Data
  useEffect(() => {
    const init = async () => {
      const [catRes, accRes] = await Promise.all([
        purchaseService.fetchCategories(),
        purchaseService.fetchAccounts()
      ]);
      setCategories(catRes.data.data || []);
      setAccountList(accRes.data.data || []);
    };
    init();
    setDateTime(new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  }, []);

  // Supplier Search Effect
  useEffect(() => {
    if (!supplierSearch.query.trim()) return setSupplierSearch(p => ({ ...p, results: [] }));
    const delay = setTimeout(async () => {
      setSupplierSearch(p => ({ ...p, loading: true }));
      try {
        const res = await purchaseService.searchSuppliers(supplierSearch.query);
        setSupplierSearch(p => ({ ...p, results: res.data.data || [], loading: false }));
      } catch { setSupplierSearch(p => ({ ...p, loading: false })); }
    }, 500);
    return () => clearTimeout(delay);
  }, [supplierSearch.query]);

  // Handlers
  const handleSelectSupplier = (s) => {
    setForm(prev => ({ ...prev, supplierId: s._id, supplier_name: s.name, address: s.address, phone: s.phone, due: s.due, advance: s.advance }));
    setSupplierSearch(p => ({ ...p, results: [] }));
  };

  const addProduct = (p) => {
    if (!products.find(item => item._id === p._id)) {
      setProducts([...products, { ...p, qty: 1, purchase_price: Number(p.purchase_price || 0) }]);
    }
    setProductSearch({ query: "", results: [], loading: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiStates(p => ({ ...p, submitting: true }));
    try {
      const payload = { 
        supplier_id: form.supplierId, 
        products: products.map(p => ({ product_id: p._id, qty: p.qty, purchase_price: p.purchase_price })),
        // ... other payload items
      };
      await purchaseService.createPurchase(payload);
      toast.success("Success!");
      setForm(initialFormState); setProducts([]);
    } catch (err) { toast.error("Failed"); }
    finally { setApiStates(p => ({ ...p, submitting: false })); }
  };

  const totalPurchase = useMemo(() => products.reduce((s, p) => s + (p.purchase_price * p.qty), 0), [products]);

  return {
    form, setForm, products, setProducts, dateTime, setDateTime,
    supplierSearch, setSupplierSearch, productSearch, setProductSearch,
    modals, setModals, apiStates, categories, accountList,
    totalPurchase, handleSelectSupplier, addProduct, handleSubmit
  };
};