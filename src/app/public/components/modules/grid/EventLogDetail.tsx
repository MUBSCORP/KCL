'use client';

import type { LogItem } from '@/app/public/types/event-log';
import { Button } from '@mui/material';
import Image from 'next/image';

interface EventLogDetailProps {
  selectedLog: LogItem | null;
}

export default function EventLogDetail({ selectedLog }: EventLogDetailProps) {
  if (!selectedLog)
    return (
      <aside className="noData">
        <i />
        <p>왼쪽목록에서 항목을 선택해 주세요</p>
      </aside>
    );
    const handleDownload = () => {
      // ✅ env.local
      const base = process.env.NEXT_PUBLIC_API_BASE ?? '';
      const path = process.env.NEXT_PUBLIC_FILE_URL ?? '/api/files/download';

      // ✅ alarmId = selectedLog.id (AlarmLogItem.builder().id(r.getAlarmid()) 로 내려주고 있음)
      const alarmId = selectedLog.id;
      if (!alarmId) return;

      const url = `${base}${path}?alarmId=${encodeURIComponent(String(alarmId))}`;

      // 가장 단순/확실: 브라우저 네비게이션으로 다운로드 트리거
      window.open(url, '_blank');
    };
  return (
    <aside className="detailAside">
      <div className="inner">
        <h4 className={`tit ${selectedLog.state.toLowerCase()}`}>{selectedLog.state}</h4>
        <div className={`tag ${selectedLog.processed ? 'fin' : 'info'}`} />
        <p className="msg" dangerouslySetInnerHTML={{ __html: selectedLog.message ?? '' }} />
        <p className="sol" dangerouslySetInnerHTML={{ __html: selectedLog.solution ?? '' }} />
        {/*{selectedLog?.time?.trim() && <p className="time">{selectedLog.time}</p>}*/}
        <dl>
          <dt>장비</dt>
          <dd className="co-blue">{selectedLog.equipment}</dd>
        </dl>
        <dl>
          <dt>채널</dt>
          <dd className="co-blue">{selectedLog.channel}</dd>
        </dl>
        <dl>
          <dt>현상</dt>
          <dd className="co-blue">{selectedLog.phenomenon}</dd>
        </dl>
        <dl>
          <dt>BatteryID</dt>
          <dd className="co-blue">{selectedLog.batteryID}</dd>
        </dl>
        <dl>
          <dt>발생시간</dt>
          <dd className="co-blue">{selectedLog.time_format}</dd>
        </dl>
        <dl>
          <dt>담당자</dt>
          <dd>{selectedLog.name}</dd>
        </dl>
       {/* <dl className="type2">
          <dt>조치내역</dt>
          <dd>{selectedLog.action}</dd>
        </dl>*/}
        <div className="btnWrap">
          <Button className="btnDownload" onClick={handleDownload}>
            <span>Get Analysis Package</span>
            <i />
          </Button>
        </div>
      </div>
    </aside>
  );
}
