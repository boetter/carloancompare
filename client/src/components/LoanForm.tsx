import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import RadioButton from './RadioButton';
import { CarLoanParams } from '@/lib/calculations';

interface LoanFormProps {
  onCalculate: (params: CarLoanParams) => void;
}

const LoanForm: React.FC<LoanFormProps> = ({ onCalculate }) => {
  const [carPrice, setCarPrice] = useState(300000);
  const [downPayment, setDownPayment] = useState(60000);
  const [downPaymentPercentage, setDownPaymentPercentage] = useState("20.0%");
  const [loanPeriod, setLoanPeriod] = useState(7);
  const [carType, setCarType] = useState<'normal' | 'hybrid' | 'electric'>('normal');
  const [carStatus, setCarStatus] = useState<'new' | 'used'>('new');
  const [carAge, setCarAge] = useState(3);
  const [showCarAge, setShowCarAge] = useState(false);

  useEffect(() => {
    updateDownPaymentPercentage();
  }, [carPrice, downPayment]);

  const updateDownPaymentPercentage = () => {
    const percentage = carPrice > 0 ? (downPayment / carPrice * 100).toFixed(1) : "0.0";
    setDownPaymentPercentage(`${percentage}%`);
  };

  const updateDownPaymentMinimum = () => {
    const minDownPayment = Math.round(carPrice * 0.2);
    if (downPayment < minDownPayment) {
      setDownPayment(minDownPayment);
    }
  };

  const handleCarPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setCarPrice(value);
    updateDownPaymentMinimum();
  };

  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const minDownPayment = Math.round(carPrice * 0.2);
    
    if (value < minDownPayment) {
      setDownPayment(minDownPayment);
    } else {
      setDownPayment(value);
    }
  };

  const handleCarStatusChange = (status: 'new' | 'used') => {
    setCarStatus(status);
    setShowCarAge(status === 'used');
  };

  const handleCalculateClick = () => {
    onCalculate({
      carPrice,
      downPayment,
      loanPeriod,
      carType,
      carStatus,
      carAge
    });
  };

  return (
    <Card className="bg-white rounded-xl shadow-md p-5 md:p-8 mb-8">
      <CardContent className="p-0">
        <h2 className="text-xl text-primary font-bold mb-6">Biloplysninger</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="car-price" className="block text-sm font-medium text-gray-700 mb-1">
                Bilens pris (kr)
              </Label>
              <Input 
                type="number" 
                id="car-price" 
                className="block w-full rounded-md border-gray-300 p-3 focus:border-accent" 
                placeholder="f.eks. 300.000" 
                min={50000}
                value={carPrice}
                onChange={handleCarPriceChange}
              />
            </div>

            <div>
              <Label htmlFor="down-payment" className="block text-sm font-medium text-gray-700 mb-1">
                Udbetaling (kr)
              </Label>
              <div className="flex items-center space-x-2">
                <Input 
                  type="number" 
                  id="down-payment" 
                  className="block w-full rounded-md border-gray-300 p-3 focus:border-accent" 
                  placeholder="f.eks. 60.000" 
                  min={0}
                  value={downPayment}
                  onChange={handleDownPaymentChange}
                />
                <span className="text-sm text-gray-500">{downPaymentPercentage}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 20% udbetaling kræves af begge banker</p>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Biltype
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <RadioButton
                  id="car-type-normal"
                  name="car-type"
                  value="normal"
                  label="Benzin/Diesel"
                  checked={carType === 'normal'}
                  onChange={() => setCarType('normal')}
                />
                <RadioButton
                  id="car-type-hybrid"
                  name="car-type"
                  value="hybrid"
                  label="Hybrid"
                  checked={carType === 'hybrid'}
                  onChange={() => setCarType('hybrid')}
                />
                <RadioButton
                  id="car-type-electric"
                  name="car-type"
                  value="electric"
                  label="El-bil"
                  checked={carType === 'electric'}
                  onChange={() => setCarType('electric')}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Bilens stand
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <RadioButton
                  id="car-status-new"
                  name="car-status"
                  value="new"
                  label="Ny bil"
                  checked={carStatus === 'new'}
                  onChange={() => handleCarStatusChange('new')}
                />
                <RadioButton
                  id="car-status-used"
                  name="car-status"
                  value="used"
                  label="Brugt bil"
                  checked={carStatus === 'used'}
                  onChange={() => handleCarStatusChange('used')}
                />
              </div>
            </div>

            {showCarAge && (
              <div>
                <Label htmlFor="car-age" className="block text-sm font-medium text-gray-700 mb-1">
                  Bilens alder (år)
                </Label>
                <Input 
                  type="number" 
                  id="car-age" 
                  className="block w-full rounded-md border-gray-300 p-3 focus:border-accent" 
                  placeholder="f.eks. 3" 
                  min={1}
                  max={10}
                  value={carAge}
                  onChange={(e) => setCarAge(parseInt(e.target.value) || 3)}
                />
                <p className="text-xs text-gray-500 mt-1">Nordea reducerer maks. løbetid med bilens alder</p>
              </div>
            )}

            <div>
              <Label htmlFor="loan-period" className="block text-sm font-medium text-gray-700 mb-1">
                Låneperiode: <span>{loanPeriod}</span> år
              </Label>
              <Slider
                id="loan-period"
                min={5}
                max={10}
                step={1}
                value={[loanPeriod]}
                onValueChange={(value) => setLoanPeriod(value[0])}
                className="my-4"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 år</span>
                <span>10 år</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button 
            className="bg-accent hover:bg-accent-light text-white font-medium py-3 px-8 rounded-lg shadow transition-colors"
            onClick={handleCalculateClick}
          >
            Sammenlign billån
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoanForm;
