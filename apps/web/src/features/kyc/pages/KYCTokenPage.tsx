/**
 * KYC Token Page
 * Handles the email link flow: /kyc/token/:token
 * Fetches prospect data by token and redirects to the KYC form
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getKYCByToken } from '@/lib/api/prospects';

interface TokenData {
  prospectId: string;
  fundId: string;
  fundName: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: string;
}

export function KYCTokenPage(): JSX.Element {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndRedirect(): Promise<void> {
      if (!token) {
        setError('Invalid link - no token provided');
        setLoading(false);
        return;
      }

      try {
        const data: TokenData = await getKYCByToken(token);

        // Check if already submitted
        if (data.status !== 'kyc_sent') {
          if (data.status === 'kyc_submitted' || data.status === 'submitted') {
            setError('This pre-qualification form has already been submitted. Thank you!');
            setLoading(false);
            return;
          }
        }

        // Store token data in sessionStorage for the KYC form to use
        sessionStorage.setItem('kyc_token', token);
        sessionStorage.setItem('kyc_token_data', JSON.stringify(data));

        // Redirect to the KYC type selector with the fund ID
        navigate(`/kyc/${data.fundId}`, { replace: true });
      } catch (err) {
        console.error('Error fetching KYC token data:', err);
        setError('This link is invalid or has expired. Please contact the fund manager for a new link.');
        setLoading(false);
      }
    }

    fetchAndRedirect();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your pre-qualification form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Unable to Load Form
          </h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  // This should never be reached, but TypeScript requires a return
  return <></>;
}

