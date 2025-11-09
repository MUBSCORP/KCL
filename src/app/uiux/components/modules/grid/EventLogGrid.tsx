'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import Link from 'next/link';
import { LogItem } from '@/app/uiux/event-log/page';
import Pagination from '@/app/uiux/components/modules/Pagination';

interface EventLogGridProps {
  rows: LogItem[];
  onSelectRow: (log: LogItem) => void;
  rowsPerPage?: number;
}

export default function EventLogGrid({ rows, onSelectRow, rowsPerPage = 8 }: EventLogGridProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(rows.length / rowsPerPage);

  const displayedRows = rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <aside className="gridWrapper">
      <TableContainer component={Paper}>
        <Table>
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell align="center">처리여부</TableCell>
              <TableCell align="center">상태</TableCell>
              <TableCell align="center">알림내용</TableCell>
              <TableCell align="center">조치내용</TableCell>
              <TableCell align="center">발생시간</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRows.map((row, idx) => (
              <TableRow key={`row-${row.id}-page-${page}-idx-${idx}`}>
                <TableCell align="center" className="processed">
                  {row.processed ? <i className="isFin" /> : <i className="isInfo" />}
                </TableCell>
                <TableCell align="center" className="state" data-state={row.state.toLocaleLowerCase()}>
                  {row.state}
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

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </aside>
  );
}
