import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { BaseLayout } from './components/layout/BaseLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { SignupPage } from './features/auth/pages/SignupPage';
import {
  InvestorDashboard,
  InvestorInvestments,
  InvestorInvestmentDetail,
  InvestorDocuments,
  InvestorProfile,
} from './features/investor-dashboard/pages';
import {
  ManagerDashboard,
  InvestorsList,
  InvestorDetail,
  DealsList,
  DealDetail,
  CreateDeal,
  CapitalCallsList,
  CapitalCallDetail,
  CreateCapitalCall,
  DocumentsManager,
  FundSettings,
} from './features/manager-dashboard/pages';
import {
  AccountantDashboard,
  K1Management,
  InvestorTaxData,
} from './features/accountant-dashboard/pages';
import {
  AttorneyDashboard,
  LegalDocuments,
  SigningStatus,
} from './features/attorney-dashboard/pages';
import {
  OnboardingPage,
  OnboardingSuccess,
  OnboardingPending,
} from './features/onboarding/pages';
import { KYCPage } from './features/kyc/pages';
import { OnboardingQueue } from './features/manager-dashboard/pages/OnboardingQueue';
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
  // Onboarding routes (public, invite-only)
  {
    path: '/onboard/:inviteCode',
    element: <OnboardingPage />,
  },
  {
    path: '/onboard/success',
    element: <OnboardingSuccess />,
  },
  {
    path: '/onboard/pending',
    element: <OnboardingPending />,
  },
  // KYC pre-qualification form (public)
  {
    path: '/kyc/:fundCode',
    element: <KYCPage />,
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
      {
        path: 'investments',
        element: <InvestorInvestments />,
      },
      {
        path: 'investments/:id',
        element: <InvestorInvestmentDetail />,
      },
      {
        path: 'documents',
        element: <InvestorDocuments />,
      },
      {
        path: 'profile',
        element: <InvestorProfile />,
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
      {
        path: 'investors',
        element: <InvestorsList />,
      },
      {
        path: 'investors/:id',
        element: <InvestorDetail />,
      },
      {
        path: 'deals',
        element: <DealsList />,
      },
      {
        path: 'deals/new',
        element: <CreateDeal />,
      },
      {
        path: 'deals/:id',
        element: <DealDetail />,
      },
      {
        path: 'capital-calls',
        element: <CapitalCallsList />,
      },
      {
        path: 'capital-calls/new',
        element: <CreateCapitalCall />,
      },
      {
        path: 'capital-calls/:id',
        element: <CapitalCallDetail />,
      },
      {
        path: 'documents',
        element: <DocumentsManager />,
      },
      {
        path: 'settings',
        element: <FundSettings />,
      },
      {
        path: 'onboarding',
        element: <OnboardingQueue />,
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
      {
        path: 'k1',
        element: <K1Management />,
      },
      {
        path: 'investors',
        element: <InvestorTaxData />,
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
      {
        path: 'documents',
        element: <LegalDocuments />,
      },
      {
        path: 'signing-status',
        element: <SigningStatus />,
      },
    ],
  },
]);

