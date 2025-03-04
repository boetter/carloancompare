import React from 'react';
import LoanForm from './LoanForm';
import ResultsComparison from './ResultsComparison';
import { LoanDetails, CarLoanParams } from '@/lib/calculations';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const LoanCalculator: React.FC = () => {
  const [showResults, setShowResults] = useState(false);
  const [loanResults, setLoanResults] = useState<{
    danske: LoanDetails;
    nordea: LoanDetails;
    nordeaLoanPeriod: number;
    danskeInterestRate: number;
    nordeaInterestRate: number;
    loanAmount: number;
  } | null>(null);
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine whether we're running on Netlify or locally
  const isNetlify = window.location.hostname.includes('netlify.app');
  const apiEndpoint = isNetlify 
    ? '/.netlify/functions/calculate-loans'
    : '/api/calculate-loans';

  const calculateMutation = useMutation({
    mutationFn: async (params: CarLoanParams) => {
      const response = await apiRequest('POST', apiEndpoint, params);
      return response.json();
    },
    onSuccess: (data) => {
      setLoanResults(data);
      setShowResults(true);
      setIsCalculating(false);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
      setIsCalculating(false);
    }
  });

  const handleCalculate = (params: CarLoanParams) => {
    setIsCalculating(true);
    setError(null);
    calculateMutation.mutate(params);
  };

  return (
    <div className="min-h-screen">
      <header className="bg-primary text-white py-6 shadow-lg">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-2xl md:text-3xl font-bold">Sammenlign Billån</h1>
          <p className="text-sm md:text-base opacity-90">Find det bedste billån mellem Danske Bank og Nordea</p>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-5xl mx-auto">
          {/* Information Box */}
          <div className="bg-blue-50 p-4 rounded-lg mb-8 border border-blue-200">
            <h2 className="font-semibold text-primary text-lg mb-2">Sammenlign billån</h2>
            <p className="text-sm text-gray-700">
              Indtast information om din ønskede bil herunder for at sammenligne lånemuligheder mellem Danske Bank og Nordea. 
              Beregningen er vejledende og baseret på de angivne vilkår fra bankerne.
            </p>
          </div>

          <LoanForm onCalculate={handleCalculate} />
          
          {isCalculating && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" role="status">
                <span className="sr-only">Indlæser...</span>
              </div>
              <p className="mt-4 text-gray-600">Beregner lånemuligheder...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg my-6">
              <h3 className="font-semibold mb-1">Der opstod en fejl</h3>
              <p className="text-sm">{error}</p>
              <p className="text-sm mt-2">Prøv venligst igen eller kontrollér dine input-værdier.</p>
            </div>
          )}

          {showResults && loanResults && !isCalculating && (
            <ResultsComparison 
              results={loanResults}
              scrollToResults={() => {
                setTimeout(() => {
                  document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            />
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center text-sm">
            <p className="mb-2">Dette er en uafhængig sammenligningsside for billån. Vi er ikke tilknyttet nogen banker.</p>
            <p className="text-gray-400">Alle renter og vilkår er vejledende og kan ændre sig. Kontakt bankerne for et personligt tilbud.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoanCalculator;
