import React from 'react';

interface RadioButtonProps {
  id: string;
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

const RadioButton: React.FC<RadioButtonProps> = ({ id, name, value, label, checked, onChange }) => {
  return (
    <div className="relative">
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <label
        htmlFor={id}
        className="flex justify-center items-center p-2 w-full text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white hover:bg-gray-50 peer-checked:hover:bg-accent transition-colors"
      >
        {label}
      </label>
    </div>
  );
};

export default RadioButton;
