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
import PurchaseForm from '../pages/Purchase/PurchaseForm';
import SalesList from './../pages/Sales/SalesList/SalesList';
import SupplierManager from './../pages/Suppliers/SupplierManager';
import Dashboard from './../pages/Dashboard/Dashboard';
import SupplierDetails from './../pages/Suppliers/SupplierDetails';
import InventoryViewer from '../pages/Inventory/InventoryViewer';
import CashData from '../pages/Cash/CashData';
import TransactionsList from '../pages/Transactions/TransactionsList';
import PurchaseList from '../pages/Purchase/PurchaseList';
import PurchaseEdit from '../pages/Purchase/PurchaseEdit';

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
      { path: '/products', element: <Products /> },
      { path: '/inventory', element: <InventoryViewer /> },
      { path: '/customers', element: <CustomerManager /> },
      { path: '/cash', element: <CashData /> },
      { path: '/transactions', element: <TransactionsList /> },
      { path: '/suppliers', element: <SupplierManager /> },
      { path: '/suppliers/:id', element: <SupplierDetails /> },
      { path: "/products/details/:id", element: <ProductDetail /> },
      { path: '/categories/:id', element: <CategoryDetail /> },
      { path: '/sales', element: <SalesList /> },
      { path: '/sales/create-sale', element: <CreateSell /> },
      { path: '/purchases', element: <PurchaseList /> },
      { path: '/purchases/create', element: <PurchaseForm /> },
      { path: '/purchases/edit/:id', element: <PurchaseEdit /> },
    ],
    // errorElement: <ErrorPage />,
  },
]);

export default router;
