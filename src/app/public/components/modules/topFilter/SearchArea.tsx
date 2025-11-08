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
  label: string;
  delete: boolean;
}

export default function SearchArea() {
  const [chipData, setChipData] = React.useState<readonly ChipData[]>([
    { key: 0, label: '#1F-001B', delete: true },
    { key: 1, label: '#1F-001B', delete: true },
    { key: 2, label: '#1F-001B', delete: true },
  ]);

  const [searchText, setSearchText] = React.useState('');

  const handleDelete = (chipToDelete: ChipData) => () => {
    setChipData((chips) => chips.filter((chip) => chip.key !== chipToDelete.key));
  };

  const handleClear = () => {
    setSearchText('');
  };

  return (
    <div className="searchArea">
      <Paper className="schInput" component="form">
        <InputBase value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="검색어입력" inputProps={{ 'aria-label': '검색어 입력' }} />
        {searchText && (
          <IconButton className="btnClear" type="button" aria-label="입력삭제" onClick={handleClear}>
            <CloseIcon />
          </IconButton>
        )}

        <IconButton className="btnSch" type="button" aria-label="검색">
          <Image src={SearchIcon} alt="" />
        </IconButton>
      </Paper>
      <dl className="schResult">
        <dt>검색결과</dt>
        <dd>
          {chipData.map((data, idx) => {
            return <Chip key={idx} className="chip" label={data.label} onDelete={!data.delete ? undefined : handleDelete(data)} />;
          })}
        </dd>
      </dl>
    </div>
  );
}
