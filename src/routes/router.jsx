import React from 'react';
import { createBrowserRouter } from 'react-router';
import MainLayout from '../layouts/Main';
import RegisterPage from '../pages/Register/Register';
import LoginPage from '../pages/Login/Login';
import Home from '../pages/Home/Home';
import Categories from './../pages/Categories/Categories';
import Products from './../pages/Products/Products';
import ProductDetail from './../pages/Products/ProductDetail';
import CategoryDetail from './../pages/Categories/CategoryDetail';
import CreateSell from '../pages/Sales/CreateSell/CreateSell';
import CustomerManager from '../pages/Customers/CustomerManager';
import SupplierManager from './../pages/Suppliers/SupplierManager';
import Dashboard from './../pages/Dashboard/Dashboard';
import SupplierDetails from './../pages/Suppliers/SupplierDetails';
import InventoryViewer from '../pages/Inventory/InventoryViewer';
import TransactionsList from '../pages/Transactions/TransactionsList';
import PurchaseEdit from '../pages/Purchase/PurchaseEdit';
import CustomerDetails from '../pages/Customers/CustomerDetails';
import DailySales from '../pages/Sales/SalesReports/DailySales';
import BatchList from '../pages/FarmBatches/BatchList';
import CreateBatchForm from '../pages/FarmBatches/CreateBatchForm';
import BatchDetails from '../pages/FarmBatches/BatchDetails/BatchDetails';
import SaleDetails from '../pages/Sales/SaleDetails';
import PaymentAccounts from '../pages/PaymentAccounts/PaymentAccounts';
import CreatePaymentAccount from '../pages/PaymentAccounts/CreatePaymentAccount';
import PurchaseManager from '../pages/Purchase/PurchaseManager';
import SalesManager from '../pages/Sales/SalesManager/SalesManager';
import BillsList from '../pages/Expenses/BillsList';
import ExpenseThreads from '../pages/Expenses/ExpenseThreads';
import SalesReports from '../pages/Sales/SalesReports/SalesReports';
import PurchaseReports from '../pages/Purchase/PurchaseReports/PurchaseReports';
import DailyPurchases from '../pages/Purchase/PurchaseReports/DailyPurchases';
import ReportsPage from '../pages/Reports/ReportsPage';
import CreatePurchase from '../pages/Purchase/CreatePurchase/CreatePurchase';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/categories', element: <Categories /> },
      { path: '/categories/:id', element: <CategoryDetail /> },

      { path: '/products', element: <Products /> },
      { path: '/inventory', element: <InventoryViewer /> },
      { path: '/customers', element: <CustomerManager /> },
      { path: '/customers/:id', element: <CustomerDetails /> },
      

      { path: '/expense-threads', element: <ExpenseThreads /> },
      { path: '/bills', element: <BillsList /> },


      { path: '/payment_accounts', element: <PaymentAccounts /> },
      { path: '/payment_accounts/create', element: <CreatePaymentAccount /> },


      { path: '/transactions', element: <TransactionsList /> },
      { path: '/suppliers', element: <SupplierManager /> },
      { path: '/suppliers/:id', element: <SupplierDetails /> },
      { path: "/products/details/:id", element: <ProductDetail /> },

      { path: '/sales', element: <SalesManager /> },
      { path: '/sales/:saleId', element: <SaleDetails /> },
      { path: '/sales/daily-sales', element: <DailySales /> },
      { path: '/sales/sales-reports', element: <SalesReports /> },

      { path: '/sales/create-sale', element: <CreateSell /> },
      { path: '/purchases', element: <PurchaseManager /> },
      { path: '/purchases/daily-purchases', element: <DailyPurchases /> },
      { path: '/purchases/create', element: <CreatePurchase/> },
      { path: '/purchases/edit/:id', element: <PurchaseEdit /> },
      { path: '/purchases/purchase-reports', element: <PurchaseReports /> },

      { path: '/farm-batches', element: <BatchList /> },
      { path: '/farm-batches/:batchId', element: <BatchDetails /> },
      { path: '/farm-batches/create-batch', element: <CreateBatchForm /> },


      { path: '/reports', element: <ReportsPage /> },
    ],
    // errorElement: <ErrorPage />,
  },
]);

export default router;
