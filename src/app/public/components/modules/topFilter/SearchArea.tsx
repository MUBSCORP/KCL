'use client';

import * as React from 'react';

import { InputBase } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Image from 'next/image';
import SearchIcon from '@/assets/images/icon/search.png';
import CloseIcon from '@mui/icons-material/Close';

interface ChipData {
  key: number;
  label: string;   // 실제 검색어
  delete: boolean;
}

interface SearchAreaProps {
  // ✅ 검색어 배열 전달
  onSearchChange?: (keywords: string[]) => void;
}

export default function SearchArea({ onSearchChange }: SearchAreaProps) {
  const [chipData, setChipData] = React.useState<ChipData[]>([]);
  const [searchText, setSearchText] = React.useState('');

  // ✅ chipData 가 바뀔 때마다 부모에게 검색어 배열 전달
  React.useEffect(() => {
    if (!onSearchChange) return;
    const keywords = chipData.map(c => c.label);
    onSearchChange(keywords);
  }, [chipData, onSearchChange]);

  const handleDelete = (chipToDelete: ChipData) => () => {
    setChipData(prev => prev.filter(chip => chip.key !== chipToDelete.key));
  };

  const handleClearInput = () => {
    setSearchText('');
    // 인풋만 지우고, 기존 chip 검색 조건은 유지
  };

  const handleSearch = () => {
    const keyword = searchText.trim();
    if (!keyword) return;

    setChipData(prev => {
      // 같은 검색어 있으면 제거하고 맨 앞으로
      const filtered = prev.filter(c => c.label !== keyword);
      const next: ChipData[] = [
        { key: Date.now(), label: keyword, delete: true },
        ...filtered,
      ].slice(0, 5); // ✅ 최대 5개 유지
      return next;
    });
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="searchArea">
      <Paper
        className="schInput"
        component="form"
        onSubmit={(e) => e.preventDefault()}
      >
        <InputBase
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="검색어입력"
          inputProps={{ 'aria-label': '검색어 입력' }}
        />

        {searchText && (
          <IconButton
            className="btnClear"
            type="button"
            aria-label="입력삭제"
            onClick={handleClearInput}
          >
            <CloseIcon />
          </IconButton>
        )}

        <IconButton
          className="btnSch"
          type="button"
          aria-label="검색"
          onClick={handleSearch}
        >
          <Image src={SearchIcon} alt="" />
        </IconButton>
      </Paper>

      <dl className="schResult">
        <dt>검색결과</dt>
        <dd>
          {chipData.map((data) => (
            <Chip
              key={data.key}
              className="chip"
              label={`#${data.label}`}
              onDelete={!data.delete ? undefined : handleDelete(data)}
            />
          ))}
        </dd>
      </dl>
    </div>
  );
}
