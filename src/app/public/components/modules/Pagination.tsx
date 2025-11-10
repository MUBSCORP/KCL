'use client';

import { Button } from '@mui/material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onChange }: PaginationProps) {
  const goToFirst = () => onChange(1);
  const goToPrev = () => onChange(Math.max(currentPage - 1, 1));
  const goToNext = () => onChange(Math.min(currentPage + 1, totalPages));
  const goToLast = () => onChange(totalPages);

  return (
    <aside className="pagenation">
      <Button className="btnStart" onClick={goToFirst} disabled={currentPage === 1} />
      <Button className="btnPrev" onClick={goToPrev} disabled={currentPage === 1} />

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
        <Button key={`pagination-btn-${num}`} variant={num === currentPage ? 'contained' : 'outlined'} onClick={() => onChange(num)}>
          {num}
        </Button>
      ))}

      <Button className="btnNext" onClick={goToNext} disabled={currentPage === totalPages} />
      <Button className="btnEnd" onClick={goToLast} disabled={currentPage === totalPages} />
    </aside>
  );
}
