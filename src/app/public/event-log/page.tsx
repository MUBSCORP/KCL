// src/app/public/event-log/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Tabs, Tab } from '@mui/material';
import SubTitle from '@/app/public/components/modules/SubTitle';
import FormSelect from '@/app/public/components/modules/form/FormSelect';
import FormDateRange from '@/app/public/components/modules/form/FormDateRange';
import FormSearch from '@/app/public/components/modules/form/FormSearch';
import EventLogGrid from '@/app/public/components/modules/grid/EventLogGrid';
import EventLogDetail from '@/app/public/components/modules/grid/EventLogDetail';
import type { LogItem } from '@/app/public/types/event-log';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// 🔥 PACK / CELL 기본값 환경변수에서 로딩
const DEFAULT_TYPE =
  (process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD as 'PACK' | 'CELL' | undefined) ??
  'PACK';

interface SelectState {
  sorting: 'latest' | 'old';
  status: 'all' | 'done' | 'pending';
  machine: string;
  state: string;
  alarmType: string;
  type: 'PACK' | 'CELL' | 'all';
  code: string;
  startDate: Date | null;
  endDate: Date | null;
  keyword: string;
}

export default function EventLog() {
  const [tab, setTab] = useState(0); // 0=전체, 1=Alarm
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  const [select, setSelect] = useState<SelectState>({
    sorting: 'latest',
    status: 'all',
    machine: 'all',
    state: 'all',
    alarmType: 'all',
    code: 'all',
    type: DEFAULT_TYPE,
    startDate: null,
    endDate: null,
    keyword: '',
  });

  const [rows, setRows] = useState<LogItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // layout
  useEffect(() => {
    document.body.setAttribute('data-layout', 'subpage');
    return () => {
      document.body.removeAttribute('data-layout');
    };
  }, []);

  // EQPID 셀렉트 옵션
  const [eqpidOptions, setEqpidOptions] = useState<
    { value: string; label: string }[]
  >([{ value: 'all', label: '전체' }]);

  useEffect(() => {
    async function fetchEqpids() {
      if (!API_BASE) return;
      const res = await fetch(`${API_BASE}/api/alarms/eqpids`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const list: string[] = await res.json();
        setEqpidOptions([
          { value: 'all', label: '전체' },
          ...list.map((eq) => ({ value: eq, label: eq })),
        ]);
      }
    }
    fetchEqpids();
  }, []);

  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleChange = <K extends keyof SelectState>(
    key: K,
    value: SelectState[K],
  ) => {
    setSelect((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setPage(0);
    fetchData(0, pageSize);
  };

  // 🔥 여기서만 Alarm 탭에서 상태를 강제 처리
  const buildQuery = (pageArg: number, sizeArg: number) => {
    const params = new URLSearchParams();

    params.set('page', String(pageArg));
    params.set('size', String(sizeArg));
    params.set('sorting', select.sorting);

    if (select.status !== 'all') params.set('status', select.status);
    if (select.machine !== 'all') params.set('machine', select.machine);

    // 🔥 Alarm 탭이면 상태를 Alarm으로 강제
    const stateToSend = tab === 1 ? 'Alarm' : select.state;
    if (stateToSend !== 'all') params.set('state', stateToSend);

    if (select.alarmType !== 'all') params.set('alarmType', select.alarmType);
    if (select.code !== 'all') params.set('code', select.code);
    if (select.keyword.trim()) params.set('keyword', select.keyword.trim());
    // 🔥 PACK / CELL 타입 전달
    if (select.type && select.type !== 'all') {
      params.set('type', select.type);
    }
    if (select.startDate) params.set('from', select.startDate.toISOString());
    if (select.endDate) params.set('to', select.endDate.toISOString());

    return params.toString();
  };

  const fetchData = async (pageArg: number, sizeArg: number) => {
    if (!API_BASE) return;
    setLoading(true);
    try {
      const query = buildQuery(pageArg, sizeArg);
      const res = await fetch(`${API_BASE}/api/alarms?${query}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        console.error('알람 조회 실패', await res.text());
        return;
      }
      const json = await res.json();

      setRows(json.content ?? []);
      setTotalElements(json.totalElements ?? 0);
      setPage(json.page ?? pageArg);
      setPageSize(json.size ?? sizeArg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 코드 0~255
  const codeOptions = [
    { value: 'all', label: '전체' },
    ...Array.from({ length: 256 }, (_, i) => ({
      value: String(i),
      label: String(i),
    })),
  ];

  // 자동 조회
  useEffect(() => {
    fetchData(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    pageSize,
    tab,
    select.sorting,
    select.status,
    select.machine,
    select.state,
    select.alarmType,
    select.code,
    select.keyword,
    select.startDate,
    select.endDate,
  ]);

  return (
    <>
      <SubTitle title="장비상세" />

      <div className="eventLogWrapper">
        {/* 왼쪽 */}
        <section className="secLeft">
          <Tabs className="tabCont" value={tab} onChange={handleChangeTab}>
            <Tab className="tabBtn" label="전체 알림" />
            <Tab className="tabBtn" label="Alarm" />
          </Tabs>

          {/* 정렬 */}
          <div className="selectSorting">
            <FormSelect
              value={select.sorting}
              options={[
                { value: 'latest', label: '최신순' },
                { value: 'old', label: '오래된순' },
              ]}
              onChange={(v) =>
                handleChange('sorting', v as SelectState['sorting'])
              }
            />
          </div>

          {/* 🔥 두 탭 모두 필터 사용, 단 상태는 탭 1에서 숨김 */}
          <aside className="filterCont">
            <div className="innerWrap">
              <div className="formCont">
                <h4 className="tit">처리여부</h4>
                <FormSelect
                  value={select.status}
                  options={[
                    { value: 'all', label: '전체' },
                    { value: 'done', label: '처리완료' },
                    { value: 'pending', label: '미처리' },
                  ]}
                  onChange={(v) =>
                    handleChange('status', v as SelectState['status'])
                  }
                />
              </div>

              <div className="formCont">
                <h4 className="tit">장비</h4>
                <FormSelect
                  value={select.machine}
                  options={eqpidOptions}
                  onChange={(v) => handleChange('machine', v)}
                />
              </div>

              {/* 🔥 상태: 전체 탭에서는 select, Alarm 탭에서는 숨김 */}
              {tab === 0 && (
                <div className="formCont">
                  <h4 className="tit">상태</h4>
                  <FormSelect
                    value={select.state}
                    options={[
                      { value: 'all', label: '전체' },
                      { value: 'Warning', label: 'Warning' },
                      { value: 'Critical', label: 'Critical' },
                      { value: 'Alarm', label: 'Alarm' },
                    ]}
                    onChange={(v) => handleChange('state', v)}
                  />
                </div>
              )}

              {/* Alarm 탭은 상태 섹션 자체 제거 */}

              <div className="formCont">
                <h4 className="tit">타입</h4>
                <FormSelect
                  value={select.alarmType}
                  options={[
                    { value: 'all', label: '전체' },
                    { value: 'Peripheral', label: 'Peripheral' },
                    {
                      value: 'PeripheralMiddleMachine',
                      label: 'PeripheralMiddleMachine',
                    },
                    { value: 'ChannelLowMachine', label: 'ChannelLowMachine' },
                    { value: 'ChannelMiddleMachine', label: 'ChannelMiddleMachine' },
                    { value: 'StepMiddleMachine', label: 'StepMiddleMachine' },
                    { value: 'ACFailurePower', label: 'ACFailurePower' },
                    { value: 'Monitor', label: 'Monitor' },
                  ]}
                  onChange={(v) => handleChange('alarmType', v)}
                />
              </div>

              <div className="formCont">
                <h4 className="tit">코드</h4>
                <FormSelect
                  value={select.code}
                  options={codeOptions}
                  onChange={(v) => handleChange('code', v)}
                />
              </div>
            </div>

            <div className="innerWrap">
              <div className="formCont">
                <h4 className="tit">발생시간</h4>
                <FormDateRange
                  startDate={select.startDate}
                  endDate={select.endDate}
                  onChangeStart={(date) => handleChange('startDate', date)}
                  onChangeEnd={(date) => handleChange('endDate', date)}
                />
              </div>

              <div className="formCont" style={{ flex: 1 }}>
                <h4 className="tit">검색어</h4>
                <FormSearch
                  keyword={select.keyword}
                  onChangeKeyword={(v) => handleChange('keyword', v)}
                  onSearch={handleSearch}
                />
              </div>
            </div>
          </aside>

          {/* 그리드 */}
          <EventLogGrid
            rows={rows}
            loading={loading}
            totalElements={totalElements}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onSelectRow={setSelectedLog}
          />
        </section>

        {/* 오른쪽 상세 */}
        <section className="secRight">
          <EventLogDetail selectedLog={selectedLog} />
        </section>
      </div>
    </>
  );
}
