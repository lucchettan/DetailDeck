import React from 'react';

// Helper function to generate duration options
const generateDurationOptions = () => {
  const options = [];
  // 15min to 45min (15min increments)
  for (let i = 15; i <= 45; i += 15) {
    options.push({ value: i, label: `${i}min` });
  }
  // 1h to 2h (15min increments)
  for (let i = 60; i <= 120; i += 15) {
    const hours = Math.floor(i / 60);
    const minutes = i % 60;
    const label = minutes === 0 ? `${hours}h` : `${hours}h${minutes.toString().padStart(2, '0')}`;
    options.push({ value: i, label });
  }
  // 2h15 to 8h (15min increments)
  for (let i = 135; i <= 480; i += 15) {
    const hours = Math.floor(i / 60);
    const minutes = i % 60;
    const label = minutes === 0 ? `${hours}h` : `${hours}h${minutes.toString().padStart(2, '0')}`;
    options.push({ value: i, label });
  }
  return options;
};

interface DurationPickerProps {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  onChange,
  className = "form-input min-w-24",
  placeholder = "Choisir",
  required = false
}) => {
  const durationOptions = generateDurationOptions();

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className={`${className} min-w-24`}
      required={required}
    >
      <option value="" disabled>{placeholder}</option>
      {durationOptions.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
};

export default DurationPicker;
