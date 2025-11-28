import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { BaseLayout } from './components/layout/BaseLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { SignupPage } from './features/auth/pages/SignupPage';
import { InvestorDashboard } from './features/investor-dashboard/pages/InvestorDashboard';
import { ManagerDashboard } from './features/manager-dashboard/pages/ManagerDashboard';
import { AccountantDashboard } from './features/accountant-dashboard/pages/AccountantDashboard';
import { AttorneyDashboard } from './features/attorney-dashboard/pages/AttorneyDashboard';
import { USER_ROLES } from '@flowveda/shared';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/investor',
    element: (
      <ProtectedRoute requiredRole={USER_ROLES.INVESTOR}>
        <BaseLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/investor/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <InvestorDashboard />,
      },
    ],
  },
  {
    path: '/manager',
    element: (
      <ProtectedRoute requiredRole={USER_ROLES.MANAGER}>
        <BaseLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/manager/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <ManagerDashboard />,
      },
    ],
  },
  {
    path: '/accountant',
    element: (
      <ProtectedRoute requiredRole={USER_ROLES.ACCOUNTANT}>
        <BaseLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/accountant/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <AccountantDashboard />,
      },
    ],
  },
  {
    path: '/attorney',
    element: (
      <ProtectedRoute requiredRole={USER_ROLES.ATTORNEY}>
        <BaseLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/attorney/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <AttorneyDashboard />,
      },
    ],
  },
]);

