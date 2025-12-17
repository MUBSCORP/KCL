// src/app/public/components/modules/grid/EventLogGrid.tsx
'use client';

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import Link from 'next/link';
import type { LogItem } from '@/app/public/types/event-log';
import Pagination from '@/app/public/components/modules/Pagination';

interface EventLogGridProps {
  rows: LogItem[];                         // 현재 페이지 데이터 (백엔드에서 page/size로 받은 content)
  loading: boolean;                        // 로딩 여부
  totalElements: number;                   // 전체 건수 (백엔드 totalElements)
  page: number;                            // 0-based 페이지 인덱스 (0,1,2,...)
  pageSize: number;                        // 한 페이지 크기
  onPageChange: (newPage: number) => void; // 페이지 변경 핸들러 (0-based)
  onSelectRow: (log: LogItem) => void;     // 행 클릭시 상세로 넘길 콜백
}

export default function EventLogGrid({
                                       rows,
                                       loading,
                                       totalElements,
                                       page,
                                       pageSize,
                                       onPageChange,
                                       onSelectRow,
                                     }: EventLogGridProps) {
  // ✅ 전체 페이지 수 (1-based)
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

  // ✅ Pagination 컴포넌트는 1-based 라고 가정
  const currentPageForUi = page + 1;

  const handlePageChange = (nextPage1Based: number) => {
    // 1-based → 0-based 변환해서 부모로 전달
    onPageChange(nextPage1Based - 1);
  };

  return (
    <aside className="gridWrapper">
      <TableContainer component={Paper}>
        <Table>
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} />
            <col />
            {/*<col style={{ width: '15%' }} />*/}
            <col style={{ width: '15%' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell align="center">처리여부</TableCell>
              <TableCell align="center">상태</TableCell>
              <TableCell align="center">Type</TableCell>
              <TableCell align="center">Code</TableCell>
              <TableCell align="center">알림내용</TableCell>
              {/*<TableCell align="center">조치내용</TableCell>*/}
              <TableCell align="center">발생시간</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* 로딩 중 & 데이터 없을 때 간단 표시 (원하면 빼도 됨) */}
            {loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  로딩 중...
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              rows.map((row, idx) => (
                <TableRow key={`row-${row.id}-page-${page}-idx-${idx}`}>
                  <TableCell align="center" className="processed">
                    {row.processed ? <i className="isFin" /> : <i className="isInfo" />}
                  </TableCell>
                  <TableCell
                    align="center"
                    className="state"
                    data-state={row.state ? row.state.toLowerCase() : ''}
                  >
                    {row.state}
                  </TableCell>
                  <TableCell align="center" className="type">
                    {row.type}
                  </TableCell>
                  <TableCell align="center" className="code">
                    {row.code}
                  </TableCell>
                  <TableCell className="notice">
                    <Link
                      href="#none"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectRow(row);
                      }}
                      dangerouslySetInnerHTML={{ __html: row.message }}
                    />
                  </TableCell>
                 {/* <TableCell align="center" className="action">
                    {row.action}
                  </TableCell>*/}
                  <TableCell align="center" className="time">
                    {row.time_format}
                  </TableCell>
                </TableRow>
              ))}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ 서버 페이징: totalElements / pageSize 기준으로 페이징 */}
      <Pagination
        currentPage={currentPageForUi} // 1-based
        totalPages={totalPages}
        onChange={handlePageChange}
      />
    </aside>
  );
}
