'use client';

import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';

interface FormDateRangeProps {
  startDate: Date | null;
  endDate: Date | null;
  onChangeStart: (date: Date | null) => void;
  onChangeEnd: (date: Date | null) => void;
}

export default function FormDateRange({ startDate, endDate, onChangeStart, onChangeEnd }: FormDateRangeProps) {
  return (
    <div className="dateRangeForm">
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
        {/* 시작일 */}
        <DatePicker
          className="datePicker"
          label="시작일"
          value={startDate}
          onChange={onChangeStart}
          maxDate={endDate || undefined}
          slotProps={{
            textField: { size: 'small', fullWidth: true },
          }}
        />

        {/* 종료일 */}
        <DatePicker
          className="datePicker"
          label="종료일"
          value={endDate}
          onChange={onChangeEnd}
          minDate={startDate || undefined}
          slotProps={{
            textField: { size: 'small', fullWidth: true },
          }}
        />
      </LocalizationProvider>
    </div>
  );
}
