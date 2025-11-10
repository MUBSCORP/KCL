'use client';

import { Select, MenuItem } from '@mui/material';
import { useEffect } from 'react';

interface FormSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export default function FormSelect({ value, options, onChange }: FormSelectProps) {
  useEffect(() => {
    if (value === '' && options.length > 0) {
      onChange(options[0].value);
    }
  }, [value, options, onChange]);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
}
