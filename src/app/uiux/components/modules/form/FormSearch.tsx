'use client';

import { TextField, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface FormSearchProps {
  keyword: string;
  onChangeKeyword: (value: string) => void;
  onSearch: () => void;
}

export default function FormSearch({ keyword, onChangeKeyword, onSearch }: FormSearchProps) {
  return (
    <>
      <TextField fullWidth size="small" label="검색어 입력" value={keyword} onChange={(e) => onChangeKeyword(e.target.value)} />
      <button type="button" className="btnSch" onClick={onSearch}>
        <span>검색</span>
        <i />
      </button>
    </>
  );
}
