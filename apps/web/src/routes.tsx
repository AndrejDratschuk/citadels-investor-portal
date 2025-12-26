import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { BaseLayout } from './components/layout/BaseLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { SignupPage } from './features/auth/pages/SignupPage';
import { CreateAccountPage } from './features/auth/pages/CreateAccountPage';
import {
  InvestorDashboard,
  InvestorInvestments,
  InvestorInvestmentDetail,
  InvestorDocuments,
  InvestorCommunications,
  InvestorProfile,
} from './features/investor-dashboard/pages';
import {
  ManagerDashboard,
  InvestorsList,
  InvestorDetail,
  DealsList,
  DealDetail,
  CreateDeal,
  EditDeal,
  CapitalCallsList,
  CapitalCallDetail,
  CreateCapitalCall,
  ManagerCommunications,
  DocumentsManager,
  FundSettings,
} from './features/manager-dashboard/pages';
import { DealFinancials } from './features/manager-dashboard/pages/DealFinancials';
import { DealKPICategory } from './features/manager-dashboard/pages/DealKPICategory';
import { DealFinancialStatements } from './features/manager-dashboard/pages/DealFinancialStatements';
import { KPISettings } from './features/manager-dashboard/pages/KPISettings';
import { CreateInvestor } from './features/manager-dashboard/pages/CreateInvestor';
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
import { KYCPage, KYCTypeSelectorPage } from './features/kyc/pages';
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
  // Account creation route (for investors with token)
  {
    path: '/create-account/:token',
    element: <CreateAccountPage />,
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
  // Landing page with investor type selection
  {
    path: '/kyc/:fundCode',
    element: <KYCTypeSelectorPage />,
  },
  // Type-specific KYC forms
  {
    path: '/kyc/:fundCode/individual',
    element: <KYCPage investorType="individual" />,
  },
  {
    path: '/kyc/:fundCode/trust',
    element: <KYCPage investorType="trust" />,
  },
  {
    path: '/kyc/:fundCode/fund',
    element: <KYCPage investorType="fund" />,
  },
  {
    path: '/kyc/:fundCode/entity',
    element: <KYCPage investorType="entity" />,
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
        path: 'communications',
        element: <InvestorCommunications />,
      },
      {
        path: 'communications/:id',
        element: <InvestorCommunications />,
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
        path: 'investors/new',
        element: <CreateInvestor />,
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
        path: 'deals/:id/edit',
        element: <EditDeal />,
      },
      {
        path: 'deals/:id/financials',
        element: <DealFinancials />,
      },
      {
        path: 'deals/:id/financials/category/:category',
        element: <DealKPICategory />,
      },
      {
        path: 'deals/:id/financials/statements',
        element: <DealFinancialStatements />,
      },
      {
        path: 'settings/kpis',
        element: <KPISettings />,
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
        path: 'communications',
        element: <ManagerCommunications />,
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

