import { pgTable, text, serial, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Car loan calculation schemas
export const carLoanCalculation = pgTable("car_loan_calculations", {
  id: serial("id").primaryKey(),
  carPrice: numeric("car_price").notNull(),
  downPayment: numeric("down_payment").notNull(),
  loanPeriod: integer("loan_period").notNull(),
  carType: text("car_type").notNull(), // 'normal', 'hybrid', 'electric'
  carStatus: text("car_status").notNull(), // 'new', 'used'
  carAge: integer("car_age"),
  createdAt: text("created_at").notNull(),
});

export const insertCarLoanSchema = createInsertSchema(carLoanCalculation).omit({
  id: true,
  createdAt: true,
});

export type InsertCarLoan = z.infer<typeof insertCarLoanSchema>;
export type CarLoan = typeof carLoanCalculation.$inferSelect;

// Shared calculation logic
export function calculateLoanDetails(
  principal: number, 
  interestRate: number, 
  periodYears: number
) {
  const monthlyRate = interestRate / 12;
  const totalPayments = periodYears * 12;
  
  // Monthly payment formula: PMT = P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments) / 
                        (Math.pow(1 + monthlyRate, totalPayments) - 1);
                        
  const totalPayment = monthlyPayment * totalPayments;
  const totalInterest = totalPayment - principal;
  
  // Simple APR calculation (not completely accurate but sufficient for illustration)
  const apr = interestRate * 1.1; // Adding approximate fees and other costs
  
  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    apr: (apr * 100).toFixed(1),
    periodYears
  };
}
