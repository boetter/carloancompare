import React, { useEffect } from 'react';
import { LoanDetails } from '@/lib/calculations';

interface ResultsComparisonProps {
  results: {
    danske: LoanDetails;
    nordea: LoanDetails;
    nordeaLoanPeriod: number;
    danskeInterestRate: number;
    nordeaInterestRate: number;
    loanAmount: number;
  };
  scrollToResults: () => void;
}

const ResultsComparison: React.FC<ResultsComparisonProps> = ({ results, scrollToResults }) => {
  useEffect(() => {
    scrollToResults();
  }, [scrollToResults]);

  const formatCurrency = (num: number) => num.toLocaleString('da-DK') + ' kr';

  const monthlyDifference = results.danske.monthlyPayment - results.nordea.monthlyPayment;
  const totalDifference = results.danske.totalPayment - results.nordea.totalPayment;

  return (
    <div id="results-section" className="mb-8">
      <h2 className="text-xl text-primary font-bold mb-6">Sammenligning af billån</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Danske Bank */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-primary text-white px-6 py-4">
            <h3 className="text-lg font-semibold">Danske Bank</h3>
            <p className="text-sm opacity-90">Variabel rente fra 2,79%</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Lånebeløb</p>
                <p className="text-lg font-semibold">{formatCurrency(results.loanAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rente</p>
                <p className="text-lg font-semibold">{(results.danskeInterestRate * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Løbetid</p>
                <p className="text-lg font-semibold">{results.danske.periodYears} år</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ÅOP</p>
                <p className="text-lg font-semibold">{results.danske.apr}%</p>
              </div>
            </div>
            
            <div className="border-t border-b border-gray-200 py-4 my-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Månedlig ydelse</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(results.danske.monthlyPayment)}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500">Samlet beløb at betale</p>
              <p className="text-lg font-semibold">{formatCurrency(results.danske.totalPayment)}</p>
              
              <p className="text-sm text-gray-500 mt-3">Samlede renteomkostninger</p>
              <p className="text-lg font-semibold">{formatCurrency(results.danske.totalInterest)}</p>
            </div>
            
            <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {(results.danskeInterestRate < 0.0279) && (
                <p className="text-success font-medium">Lavere rente for el- og plug-in hybridbiler</p>
              )}
              <p>20% udbetaling</p>
              <p>Løbetid op til 10 år</p>
            </div>
          </div>
        </div>
        
        {/* Nordea */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-primary-light text-white px-6 py-4">
            <h3 className="text-lg font-semibold">Nordea</h3>
            <p className="text-sm opacity-90">Variabel rente fra 3,50%</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Lånebeløb</p>
                <p className="text-lg font-semibold">{formatCurrency(results.loanAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rente</p>
                <p className="text-lg font-semibold">{(results.nordeaInterestRate * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Løbetid</p>
                <p className="text-lg font-semibold">{results.nordeaLoanPeriod} år</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ÅOP</p>
                <p className="text-lg font-semibold">{results.nordea.apr}%</p>
              </div>
            </div>
            
            <div className="border-t border-b border-gray-200 py-4 my-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Månedlig ydelse</p>
                <p className="text-xl font-bold text-primary-light">{formatCurrency(results.nordea.monthlyPayment)}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500">Samlet beløb at betale</p>
              <p className="text-lg font-semibold">{formatCurrency(results.nordea.totalPayment)}</p>
              
              <p className="text-sm text-gray-500 mt-3">Samlede renteomkostninger</p>
              <p className="text-lg font-semibold">{formatCurrency(results.nordea.totalInterest)}</p>
            </div>
            
            <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p>20% udbetaling</p>
              <p>Løbetid op til 10 år for nye biler</p>
              {results.nordeaLoanPeriod < results.danske.periodYears && (
                <p>For brugte biler reduceres maks. løbetid med bilens alder</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Comparison Summary */}
      <div className="bg-blue-50 rounded-lg p-6 mt-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-primary mb-3">Sammenligning</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-600 mb-2">Forskel i månedlig ydelse</p>
            <p className="text-xl font-bold">
              {monthlyDifference < 0 ? (
                <><span className="text-success">{formatCurrency(monthlyDifference)}</span> med Danske Bank</>
              ) : (
                <><span className="text-success">{formatCurrency(-monthlyDifference)}</span> med Nordea</>
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-600 mb-2">Samlet besparelse over lånets løbetid</p>
            <p className="text-xl font-bold">
              {totalDifference < 0 ? (
                <><span className="text-success">{formatCurrency(totalDifference)}</span> med Danske Bank</>
              ) : (
                <><span className="text-success">{formatCurrency(-totalDifference)}</span> med Nordea</>
              )}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">Bemærk: Beregningen er vejledende baseret på de angivne vilkår. Kontakt bankerne for et konkret tilbud.</p>
      </div>
    </div>
  );
};

export default ResultsComparison;
