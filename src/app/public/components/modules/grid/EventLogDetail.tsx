'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import Link from 'next/link';
import { LogItem } from '@/app/public/event-log/page';
// 디자인 퍼블 Pagination 사용 경로
import Pagination from '@/app/public/components/modules/Pagination';

// LogItem에 디자인에서 추가된 필드(type, code)를 옵션으로 확장
type RowType = LogItem & {
  type?: string;
  code?: string;
};

interface EventLogGridProps {
  rows: RowType[];
  onSelectRow: (log: LogItem) => void;
  rowsPerPage?: number;
}

export default function EventLogGrid({
                                       rows,
                                       onSelectRow,
                                       rowsPerPage = 10, // 디자인 기본값(10) 사용
                                     }: EventLogGridProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(rows.length / rowsPerPage || 1);

  const displayedRows = rows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <aside className="gridWrapper">
      <TableContainer component={Paper}>
        <Table>
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '5%' }} />
            <col />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell align="center">처리여부</TableCell>
              <TableCell align="center">상태</TableCell>
              <TableCell align="center">Type</TableCell>
              <TableCell align="center">Code</TableCell>
              <TableCell align="center">알림내용</TableCell>
              <TableCell align="center">조치내용</TableCell>
              <TableCell align="center">발생시간</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRows.map((row, idx) => (
              <TableRow key={`row-${row.id}-page-${page}-idx-${idx}`}>
                {/* 처리여부 아이콘 (기능 그대로) */}
                <TableCell align="center" className="processed">
                  {row.processed ? <i className="isFin" /> : <i className="isInfo" />}
                </TableCell>

                {/* 상태 – 소문자 state를 data-state에 넣어서 CSS에서 색상 제어 */}
                <TableCell
                  align="center"
                  className="state"
                  data-state={row.state.toLocaleLowerCase()}
                >
                  {row.state}
                </TableCell>

                {/* 디자인 퍼블 추가: Type / Code */}
                <TableCell align="center" className="type">
                  {row.type ?? '-'}
                </TableCell>
                <TableCell align="center" className="code">
                  {row.code ?? '-'}
                </TableCell>

                {/* 알림내용 – 클릭 시 상세 패널 선택 (기능 그대로) */}
                <TableCell className="notice">
                  <Link
                    href="#none"
                    onClick={e => {
                      e.preventDefault();
                      onSelectRow(row);
                    }}
                    dangerouslySetInnerHTML={{ __html: row.message }}
                  />
                </TableCell>

                {/* 조치내용 / 발생시간 – 기능 그대로 */}
                <TableCell align="center" className="action">
                  {row.action}
                </TableCell>
                <TableCell align="center" className="time">
                  {row.time}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination – 기능 버전 그대로, 디자인 퍼블 컴포넌트 사용 */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onChange={setPage}
      />
    </aside>
  );
}
