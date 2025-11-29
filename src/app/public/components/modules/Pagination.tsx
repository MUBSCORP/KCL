'use client';

import { Button } from '@mui/material';

interface PaginationProps {
  currentPage: number;          // 1-based
  totalPages: number;           // 전체 페이지 수
  onChange: (page: number) => void;
}

const MAX_VISIBLE = 10;         // 🔹 한번에 보여줄 최대 페이지 버튼 수

export default function Pagination({
                                     currentPage,
                                     totalPages,
                                     onChange,
                                   }: PaginationProps) {
  if (totalPages <= 0) return null;

  const goToFirst = () => onChange(1);
  const goToPrev = () => onChange(Math.max(currentPage - 1, 1));
  const goToNext = () => onChange(Math.min(currentPage + 1, totalPages));
  const goToLast = () => onChange(totalPages);

  // 🔹 start / end 계산 (슬라이딩 윈도우)
  let start = Math.max(1, currentPage - Math.floor(MAX_VISIBLE / 2));
  let end = start + MAX_VISIBLE - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - MAX_VISIBLE + 1);
  }

  const pages: number[] = [];
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }

  return (
    <aside className="pagenation">
      <Button
        className="btnStart"
        onClick={goToFirst}
        disabled={currentPage === 1}
      />
      <Button
        className="btnPrev"
        onClick={goToPrev}
        disabled={currentPage === 1}
      />

      {pages.map((num) => (
        <Button
          key={`pagination-btn-${num}`}
          variant={num === currentPage ? 'contained' : 'outlined'}
          onClick={() => onChange(num)}
        >
          {num}
        </Button>
      ))}

      <Button
        className="btnNext"
        onClick={goToNext}
        disabled={currentPage === totalPages}
      />
      <Button
        className="btnEnd"
        onClick={goToLast}
        disabled={currentPage === totalPages}
      />
    </aside>
  );
}
