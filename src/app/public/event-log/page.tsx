'use client';

import { useState, useEffect } from 'react';
import { Tabs, Tab } from '@mui/material';
import SubTitle from '@/app/public/components/modules/SubTitle';
import FormSelect from '@/app/public/components/modules/form/FormSelect';
import FormDateRange from '@/app/public/components/modules/form/FormDateRange';
import FormSearch from '@/app/public/components/modules/form/FormSearch';
import EventLogGrid from '@/app/public/components/modules/grid/EventLogGrid';
import EventLogDetail from '@/app/public/components/modules/grid/EventLogDetail';


export interface LogItem {
  id: number;
  processed: boolean;
  state: string;
  type: string;
  code: string;
  message: string;
  action: string;
  time: string;
  solution: string;
  equipment: string;
  channel: string;
  phenomenon: string;
  batteryID: string;
  name: string;
}

export default function EventLog() {
  const [tab, setTab] = useState(0);
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  const [select, setSelect] = useState({
    sorting: 'latest',
    status: 'all',
    machine: 'all',
    state: 'all',
    startDate: null as Date | null,
    endDate: null as Date | null,
    keyword: '',
  });

  useEffect(() => {
    document.body.setAttribute('data-layout', 'subpage');

    return () => {
      document.body.removeAttribute('data-layout');
    };
  }, []);

  const [rows] = useState<LogItem[]>([
    {
      id: 1,
      processed: true,
      state: 'Caution',
      type: '2',
      code: '26',
      message: `<strong>#장비(EQPID)#</strong>의 <strong>#채널(Channel)#</strong>에 <strong>#현상(Description)#</strong>이 발생하였습니다.`,
      action: '#입력 값 수신#',
      time: '[Occur time]',
      solution: `<strong>#조치(Troubleshooting)#</strong>해주시기 바랍니다.`,
      equipment: '[EQPID]',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '(사용자정의)',
    },
    {
      id: 2,
      processed: false,
      state: 'Critical Alarm',
      type: '2',
      code: '26',
      message: '<strong>1F-001</strong> 의 <strong>2</strong> 채널에 <strong>Sampling Cable Disconnection</strong>현상이 발생하였습니다.',
      action: '케이블 재연결',
      time: '2025-08-12 14:15:00',
      solution: `<strong>Please check the cable</strong>해주시기 바랍니다.`,
      equipment: '1F-001',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '김엔지니어 (010-1234-5678)',
    },
    {
      id: 3,
      processed: true,
      state: 'Caution',
      type: '2',
      code: '26',
      message: `<strong>#장비(EQPID)#</strong>의 <strong>#채널(Channel)#</strong>에 <strong>#현상(Description)#</strong>이 발생하였습니다.`,
      action: '#입력 값 수신#',
      time: '[Occur time]',
      solution: `<strong>#조치(Troubleshooting)#</strong>해주시기 바랍니다.`,
      equipment: '[EQPID]',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '(사용자정의)',
    },
    {
      id: 4,
      processed: false,
      state: 'Critical Alarm',
      type: '2',
      code: '26',
      message: '<strong>1F-001</strong> 의 <strong>2</strong> 채널에 <strong>Sampling Cable Disconnection</strong>현상이 발생하였습니다.',
      action: '케이블 재연결',
      time: '2025-08-12 14:15:00',
      solution: `<strong>Please check the cable</strong>해주시기 바랍니다.`,
      equipment: '1F-001',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '김엔지니어 (010-1234-5678)',
    },
    {
      id: 5,
      processed: true,
      state: 'Caution',
      type: '2',
      code: '26',
      message: `<strong>#장비(EQPID)#</strong>의 <strong>#채널(Channel)#</strong>에 <strong>#현상(Description)#</strong>이 발생하였습니다.`,
      action: '#입력 값 수신#',
      time: '[Occur time]',
      solution: `<strong>#조치(Troubleshooting)#</strong>해주시기 바랍니다.`,
      equipment: '[EQPID]',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '(사용자정의)',
    },
    {
      id: 6,
      processed: false,
      state: 'Critical Alarm',
      type: '2',
      code: '26',
      message: '<strong>1F-001</strong> 의 <strong>2</strong> 채널에 <strong>Sampling Cable Disconnection</strong>현상이 발생하였습니다.',
      action: '케이블 재연결',
      time: '2025-08-12 14:15:00',
      solution: `<strong>Please check the cable</strong>해주시기 바랍니다.`,
      equipment: '1F-001',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '김엔지니어 (010-1234-5678)',
    },
    {
      id: 7,
      processed: true,
      state: 'Caution',
      type: '2',
      code: '26',
      message: `<strong>#장비(EQPID)#</strong>의 <strong>#채널(Channel)#</strong>에 <strong>#현상(Description)#</strong>이 발생하였습니다.`,
      action: '#입력 값 수신#',
      time: '[Occur time]',
      solution: `<strong>#조치(Troubleshooting)#</strong>해주시기 바랍니다.`,
      equipment: '[EQPID]',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '(사용자정의)',
    },
    {
      id: 8,
      processed: false,
      state: 'Critical Alarm',
      type: '2',
      code: '26',
      message: '<strong>1F-001</strong> 의 <strong>2</strong> 채널에 <strong>Sampling Cable Disconnection</strong>현상이 발생하였습니다.',
      action: '케이블 재연결',
      time: '2025-08-12 14:15:00',
      solution: `<strong>Please check the cable</strong>해주시기 바랍니다.`,
      equipment: '1F-001',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '김엔지니어 (010-1234-5678)',
    },
    {
      id: 9,
      processed: true,
      state: 'Caution',
      type: '2',
      code: '26',
      message: `<strong>#장비(EQPID)#</strong>의 <strong>#채널(Channel)#</strong>에 <strong>#현상(Description)#</strong>이 발생하였습니다.`,
      action: '#입력 값 수신#',
      time: '[Occur time]',
      solution: `<strong>#조치(Troubleshooting)#</strong>해주시기 바랍니다.`,
      equipment: '[EQPID]',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '(사용자정의)',
    },
    {
      id: 10,
      processed: false,
      state: 'Critical Alarm',
      type: '2',
      code: '26',
      message: '<strong>1F-001</strong> 의 <strong>2</strong> 채널에 <strong>Sampling Cable Disconnection</strong>현상이 발생하였습니다.',
      action: '케이블 재연결',
      time: '2025-08-12 14:15:00',
      solution: `<strong>Please check the cable</strong>해주시기 바랍니다.`,
      equipment: '1F-001',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '김엔지니어 (010-1234-5678)',
    },
    {
      id: 11,
      processed: true,
      state: 'Caution',
      type: '2',
      code: '26',
      message: `<strong>#장비(EQPID)#</strong>의 <strong>#채널(Channel)#</strong>에 <strong>#현상(Description)#</strong>이 발생하였습니다.`,
      action: '#입력 값 수신#',
      time: '[Occur time]',
      solution: `<strong>#조치(Troubleshooting)#</strong>해주시기 바랍니다.`,
      equipment: '[EQPID]',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '(사용자정의)',
    },
    {
      id: 12,
      processed: false,
      state: 'Critical Alarm',
      type: '2',
      code: '26',
      message: '<strong>1F-001</strong> 의 <strong>2</strong> 채널에 <strong>Sampling Cable Disconnection</strong>현상이 발생하였습니다.',
      action: '케이블 재연결',
      time: '2025-08-12 14:15:00',
      solution: `<strong>Please check the cable</strong>해주시기 바랍니다.`,
      equipment: '1F-001',
      channel: '[EQPID]',
      phenomenon: '[EQPID]',
      batteryID: '[EQPID]',
      name: '김엔지니어 (010-1234-5678)',
    },
  ]);

  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleChange = (key: string, value: any) => {
    setSelect((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    console.log('검색 실행', select);
  };

  return (
    <>
      <SubTitle title="장비상세" />
      <div className="eventLogWrapper">
        {/* 왼쪽 영역 */}
        <section className="secLeft">
          <Tabs className="tabCont" value={tab} onChange={handleChangeTab}>
            <Tab className="tabBtn" label="전체 알림" />
            <Tab className="tabBtn" label="Caution" />
          </Tabs>

          {/* 정렬 */}
          <div className="selectSorting">
            <FormSelect
              value={select.sorting}
              options={[
                { value: 'latest', label: '최신순' },
                { value: 'old', label: '오래된순' },
              ]}
              onChange={(v) => handleChange('sorting', v)}
            />
          </div>

          {/* 필터 + 그리드 */}
          {tab === 0 && (
            <>
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
                      onChange={(v) => handleChange('status', v)}
                    />
                  </div>

                  <div className="formCont">
                    <h4 className="tit">장비</h4>
                    <FormSelect value={select.machine} options={[{ value: 'all', label: '전체' }]} onChange={(v) => handleChange('machine', v)} />
                  </div>

                  <div className="formCont">
                    <h4 className="tit">상태</h4>
                    <FormSelect value={select.state} options={[{ value: 'all', label: '전체' }]} onChange={(v) => handleChange('state', v)} />
                  </div>

                  <div className="formCont">
                    <h4 className="tit">타입</h4>
                    <FormSelect value={select.state} options={[{ value: 'all', label: '전체' }]} onChange={(v) => handleChange('state', v)} />
                  </div>

                  <div className="formCont">
                    <h4 className="tit">코드</h4>
                    <FormSelect value={select.state} options={[{ value: 'all', label: '전체' }]} onChange={(v) => handleChange('state', v)} />
                  </div>
                </div>
                <div className="innerWrap">
                  <div className="formCont">
                    <h4 className="tit">발생시간</h4>
                    <FormDateRange startDate={select.startDate} endDate={select.endDate} onChangeStart={(date) => handleChange('startDate', date)} onChangeEnd={(date) => handleChange('endDate', date)} />
                  </div>

                  <div className="formCont" style={{ flex: 1 }}>
                    <h4 className="tit">검색어</h4>
                    <FormSearch keyword={select.keyword} onChangeKeyword={(v) => handleChange('keyword', v)} onSearch={handleSearch} />
                  </div>
                </div>
              </aside>

              <EventLogGrid rows={rows} onSelectRow={setSelectedLog} />
            </>
          )}
        </section>

        {/* 오른쪽 영역 */}
        <section className="secRight">
          <EventLogDetail selectedLog={selectedLog} />
        </section>
      </div>
    </>
  );
}
