// Netlify-funktion til at beregne billån

exports.handler = async (event, context) => {
  console.log("Netlify function startet: calculate-loans");
  console.log("HTTP-metode:", event.httpMethod);
  console.log("Path:", event.path);
  console.log("Headers:", JSON.stringify(event.headers));
  
  // Tilføj CORS-headers for at tillade cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*', // Tillad alle origins i udviklingsfasen
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Håndtér preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS pre-flight request successful' })
    };
  }

  try {
    // Kontrollér at det er en POST-anmodning
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: 'Metode ikke tilladt' }),
      };
    }

    // Parse request body
    console.log("Request body:", event.body);
    const body = JSON.parse(event.body);
    console.log("Parsed body:", body);
    
    const {
      carPrice,
      downPayment,
      loanPeriod,
      carType,
      carStatus,
      carAge
    } = body;
    
    console.log("Extracted parameters:", {
      carPrice,
      downPayment,
      loanPeriod,
      carType,
      carStatus,
      carAge
    });
    
    // Validér inputs
    if (!carPrice || !downPayment || !loanPeriod || !carType || !carStatus) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Manglende påkrævede parametre' }),
      };
    }
    
    // Beregn lånebeløb
    const loanAmount = carPrice - downPayment;
    
    // Tjek minimum udbetaling (20%)
    const minDownPayment = carPrice * 0.2;
    if (downPayment < minDownPayment) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: 'Minimum udbetaling skal være 20% af bilens pris' 
        }),
      };
    }
    
    // Få rentesatser baseret på biltype
    const danskeInterestRates = {
      normal: 0.0279,
      hybrid: 0.0229,
      electric: 0.0229
    };
    
    const danskeInterestRate = danskeInterestRates[carType];
    const nordeaInterestRate = 0.0350;
    
    // Justér låneperiode for Nordea, hvis det er en brugt bil
    let nordeaLoanPeriod = loanPeriod;
    if (carStatus === 'used') {
      nordeaLoanPeriod = Math.min(loanPeriod, 10 - carAge);
      if (nordeaLoanPeriod < 1) nordeaLoanPeriod = 1;
    }
    
    // Beregn lånedetaljer
    const danskeResults = calculateLoanDetails(loanAmount, danskeInterestRate, loanPeriod);
    const nordeaResults = calculateLoanDetails(loanAmount, nordeaInterestRate, nordeaLoanPeriod);
    
    console.log('Beregning gennemført succesfuldt:', { danskeResults, nordeaResults });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        danske: danskeResults,
        nordea: nordeaResults,
        nordeaLoanPeriod,
        danskeInterestRate,
        nordeaInterestRate,
        loanAmount
      }),
    };
  } catch (error) {
    console.error('Fejl i beregningsfunktion:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Serverfejl', error: error.message }),
    };
  }
};

// Beregningsfunktion
function calculateLoanDetails(principal, interestRate, periodYears) {
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
}