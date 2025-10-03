import React from 'react';
import { createBrowserRouter } from 'react-router';
import MainLayout from '../layouts/Main';
import RegisterPage from '../pages/Register/Register';
import LoginPage from '../pages/Login/Login';
import DashboardPage from '../pages/DashboardPage/DashboardPage';
import Categories from '../pages/Categories/Categories';
import CategoryDetail from '../pages/Categories/CategoryDetail';
import ProductList from '../pages/ProductList/ProductList';
import Products from '../pages/Products/Products';
import ProductDetail from '../pages/Products/ProductDetail';
import Budget from '../pages/Budget/Budget';
import BudgetDetails from '../pages/Budget/BudgetDetails/BudgetDetails';
import AddTransactionForm from '../pages/Expense/AddTransactionForm';
import Transaction from '../pages/Expense/Transaction';
import TransactionList from '../pages/Expense/TransactionList';
import ConsumptionPlan from '../pages/ConsumptionPlan/ConsumptionPlan';
import HomePage from './../pages/HomePage/HomePage';
import BudgetReports from '../pages/Reports/BudgetReports';
import WeekRoutineEditor from '../pages/Routine/WeekRoutineEditor';
import ExpenseNotes from '../pages/ExpenseNotes/ExpenseNotes';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/categories', element: <Categories /> },
      { path: '/products', element: <Products /> },
      { path: "/products/details/:id", element: <ProductDetail /> },
      { path: '/categories/:id', element: <CategoryDetail /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/dashboard/products-list', element: <ProductList /> },
      { path: '/budgets', element: <Budget /> },
      { path: '/expenses', element: <Transaction /> },
      { path: '/expense-notes', element: <ExpenseNotes /> },
      { path: '/budget/expenses/:budgetId', element: <TransactionList /> },
      { path: '/budget/expenses/:budgetId/add-transaction', element: <AddTransactionForm /> },
      { path: '/budgets/:budgetId', element: <BudgetDetails /> },
      { path: '/reports', element: <BudgetReports /> },
      { path: '/consumptions', element: <ConsumptionPlan /> },
      { path: '/routine', element: <WeekRoutineEditor /> },
    ],
    // errorElement: <ErrorPage />,
  },
]);

export default router;
