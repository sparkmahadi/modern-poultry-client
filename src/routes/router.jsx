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
      { path: '/customers', element: <CustomerManager /> },
      { path: '/suppliers', element: <SupplierManager /> },
      { path: '/suppliers/:id', element: <SupplierDetails /> },
      { path: "/products/details/:id", element: <ProductDetail /> },
      { path: '/categories/:id', element: <CategoryDetail /> },
      { path: '/sales', element: <SalesList /> },
      { path: '/sales/create-sale', element: <CreateSell /> },
      { path: '/purchases', element: <PurchaseForm /> },
    ],
    // errorElement: <ErrorPage />,
  },
]);

export default router;
