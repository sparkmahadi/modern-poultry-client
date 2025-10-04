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
import CreateSell from '../pages/Sales/CreateSell';
import CustomerManager from '../pages/Customers/CustomerManager';
import PurchaseForm from '../pages/Purchase/PurchaseForm';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/categories', element: <Categories /> },
      { path: '/products', element: <Products /> },
      { path: '/customers', element: <CustomerManager /> },
      { path: "/products/details/:id", element: <ProductDetail /> },
      { path: '/categories/:id', element: <CategoryDetail /> },
      { path: '/sales', element: <CreateSell /> },
      { path: '/purchases', element: <PurchaseForm /> },
    ],
    // errorElement: <ErrorPage />,
  },
]);

export default router;
