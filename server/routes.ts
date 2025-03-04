import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculateLoanDetails } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for calculating loans
  app.post('/api/calculate-loans', (req, res) => {
    const {
      carPrice,
      downPayment,
      loanPeriod,
      carType,
      carStatus,
      carAge
    }: {
      carPrice: number;
      downPayment: number;
      loanPeriod: number;
      carType: 'normal' | 'hybrid' | 'electric';
      carStatus: 'new' | 'used';
      carAge: number;
    } = req.body;
    
    // Validate inputs
    if (!carPrice || !downPayment || !loanPeriod || !carType || !carStatus) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Calculate loan amount
    const loanAmount = carPrice - downPayment;
    
    // Check minimum down payment (20%)
    const minDownPayment = carPrice * 0.2;
    if (downPayment < minDownPayment) {
      return res.status(400).json({ 
        message: 'Minimum udbetaling skal være 20% af bilens pris' 
      });
    }
    
    // Get interest rates based on car type
    const danskeInterestRates: Record<string, number> = {
      normal: 0.0279,
      hybrid: 0.0229,
      electric: 0.0229
    };
    
    const danskeInterestRate = danskeInterestRates[carType as string];
    const nordeaInterestRate = 0.0350;
    
    // Adjust loan period for Nordea if used car
    let nordeaLoanPeriod = loanPeriod;
    if (carStatus === 'used') {
      nordeaLoanPeriod = Math.min(loanPeriod, 10 - carAge);
      if (nordeaLoanPeriod < 1) nordeaLoanPeriod = 1;
    }
    
    // Calculate loan details
    const danskeResults = calculateLoanDetails(loanAmount, danskeInterestRate, loanPeriod);
    const nordeaResults = calculateLoanDetails(loanAmount, nordeaInterestRate, nordeaLoanPeriod);
    
    return res.json({
      danske: danskeResults,
      nordea: nordeaResults,
      nordeaLoanPeriod,
      danskeInterestRate,
      nordeaInterestRate,
      loanAmount
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
