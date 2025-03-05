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
  const [usingLocalCalculation, setUsingLocalCalculation] = useState(false);

  // Determine whether we're running on Netlify or locally
  const isNetlify = window.location.hostname.includes('netlify.app') || 
                    window.location.hostname.includes('.replit.app') || 
                    window.location.hostname === 'localhost';
  
  // Brug det rigtige endpoint baseret på vores URL
  let apiEndpoint = '/api/calculate-loans';
  
  // Tjek for Netlify miljø baseret på flere faktorer
  if (isNetlify || 
      process.env.NODE_ENV === 'production' || 
      window.location.hostname !== 'localhost') {
    // På Netlify eller i produktion bruger vi netlify functions
    apiEndpoint = '/.netlify/functions/calculate-loans';
  }

  console.log('Anvendt API-endpoint:', apiEndpoint);

  const calculateMutation = useMutation({
    mutationFn: async (params: CarLoanParams) => {
      console.log('Sender beregningsanmodning til:', apiEndpoint);
      try {
        // Brug en standard fetch i stedet for apiRequest, da vi måske har problemer med CORS
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText || response.statusText}`);
        }
        
        return await response.json();
      } catch (err) {
        console.error('Fejl ved API-kald:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('Beregning vellykket:', data);
      setLoanResults(data);
      setShowResults(true);
      setIsCalculating(false);
      setError(null);
    },
    onError: (error: Error) => {
      console.error('Fejl ved beregning, skifter til lokal beregning:', error);
      
      // Vis brugeren at vi bruger lokal beregning i stedet
      setUsingLocalCalculation(true);
      
      // Brug lokal beregning i stedet og vis en venlig advarsel til brugeren
      try {
        console.log('Bruger lokal beregning som backup');
        const localResults = calculateLocally(calculateMutation.variables as CarLoanParams);
        setLoanResults(localResults);
        setShowResults(true);
        setIsCalculating(false);
        setError(null);
        
        // Vis en venlig notifikation om at vi bruger lokal beregning
        console.info('Bruger lokal beregning grundet følgende fejl:', error.message);
      } catch (localError) {
        console.error('Alvorlig fejl ved lokal beregning:', localError);
        setError('Der opstod en fejl under beregningen. Prøv igen senere eller prøv at genindlæse siden.');
        setIsCalculating(false);
      }
    }
  });

  // Fallback-beregning hvis API-kaldet fejler
  const calculateLocally = (params: CarLoanParams) => {
    // Beregn lånebeløb
    const loanAmount = params.carPrice - params.downPayment;
    
    // Få rentesatser baseret på biltype
    const danskeInterestRates: {[key: string]: number} = {
      normal: 0.0279,
      hybrid: 0.0229,
      electric: 0.0229
    };
    
    const danskeInterestRate = danskeInterestRates[params.carType];
    const nordeaInterestRate = 0.0350;
    
    // Justér låneperiode for Nordea, hvis det er en brugt bil
    let nordeaLoanPeriod = params.loanPeriod;
    if (params.carStatus === 'used') {
      nordeaLoanPeriod = Math.min(params.loanPeriod, 10 - params.carAge);
      if (nordeaLoanPeriod < 1) nordeaLoanPeriod = 1;
    }
    
    // Beregn lånedetaljer lokalt
    const calculateLocalLoanDetails = (principal: number, interestRate: number, periodYears: number) => {
      const monthlyRate = interestRate / 12;
      const totalPayments = periodYears * 12;
      
      // Månedlig ydelses-formel: PMT = P * r * (1+r)^n / ((1+r)^n - 1)
      const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments) / 
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);
                          
      const totalPayment = monthlyPayment * totalPayments;
      const totalInterest = totalPayment - principal;
      
      // Simpel ÅOP-beregning
      const apr = interestRate * 1.1; // Tilføjer omtrentlige gebyrer og andre omkostninger
      
      return {
        monthlyPayment: Math.round(monthlyPayment),
        totalPayment: Math.round(totalPayment),
        totalInterest: Math.round(totalInterest),
        apr: (apr * 100).toFixed(1),
        periodYears
      };
    };
    
    const danskeResults = calculateLocalLoanDetails(loanAmount, danskeInterestRate, params.loanPeriod);
    const nordeaResults = calculateLocalLoanDetails(loanAmount, nordeaInterestRate, nordeaLoanPeriod);
    
    return {
      danske: danskeResults,
      nordea: nordeaResults,
      nordeaLoanPeriod,
      danskeInterestRate,
      nordeaInterestRate,
      loanAmount
    };
  };

  const handleCalculate = (params: CarLoanParams) => {
    setIsCalculating(true);
    setError(null);
    setUsingLocalCalculation(false);
    
    // Tjek minimum udbetaling (20%)
    const minDownPayment = params.carPrice * 0.2;
    if (params.downPayment < minDownPayment) {
      setError(`Minimum udbetaling skal være ${Math.ceil(minDownPayment).toLocaleString()} kr. (20% af bilens pris)`);
      setIsCalculating(false);
      return;
    }
    
    try {
      // Prøv først at bruge API'en
      calculateMutation.mutate(params);
      
      // Hvis der går mere end 5 sekunder uden svar, brug lokal beregning som fallback
      const timeoutId = setTimeout(() => {
        if (isCalculating) {
          console.log('API timeout efter 5 sekunder - bruger lokal beregning i stedet');
          try {
            const localResults = calculateLocally(params);
            setLoanResults(localResults);
            setShowResults(true);
            setIsCalculating(false);
            setUsingLocalCalculation(true);
            setError(null);
            
            // Log information om timeout
            console.info('Bruger lokal beregning grundet timeout på API-kald');
          } catch (fallbackError) {
            console.error('Fejl under lokal beregning efter timeout:', fallbackError);
            setError('Der opstod en fejl under beregningen efter timeout. Prøv igen senere.');
            setIsCalculating(false);
          }
        }
      }, 5000);
      
      // Ryd timeouten, hvis beregningen lykkes før timeout
      return () => clearTimeout(timeoutId);
    } catch (err) {
      console.error('Fejl ved beregning, bruger lokal beregning i stedet:', err);
      const localResults = calculateLocally(params);
      setLoanResults(localResults);
      setShowResults(true);
      setIsCalculating(false);
      setUsingLocalCalculation(true);
      setError(null);
    }
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
          
          {usingLocalCalculation && !error && showResults && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg my-6">
              <h3 className="font-semibold mb-1">Lokal beregning</h3>
              <p className="text-sm">Vi kunne ikke forbinde til serveren og bruger derfor lokal beregning. Tallene er baseret på standard rentesatser.</p>
              <p className="text-sm mt-2">Dette kan ske under høj belastning, netværksproblemer eller hvis API'en er utilgængelig.</p>
              <p className="text-sm mt-2">
                <strong>Bemærk:</strong> Lokale beregninger bruger følgende standardrenter:<br />
                - Danske Bank: {loanResults ? `${(loanResults.danskeInterestRate * 100).toFixed(2)}%` : '2,29-2,79%'} (afhængig af biltype)<br />
                - Nordea: {loanResults ? `${(loanResults.nordeaInterestRate * 100).toFixed(2)}%` : '3,50%'}
              </p>
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
