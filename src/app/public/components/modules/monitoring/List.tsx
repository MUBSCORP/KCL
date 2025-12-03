'use client';

import React from 'react';
import {
  IconButton,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
} from '@mui/material';
import Image from 'next/image';
import IconMemo from '@/assets/images/icon/memo.png';
import CloseIcon from '@mui/icons-material/Close';

interface ListItem {
  id: number;

  // 위치
  x?: number;
  y?: number;

  title: string;
  check: boolean;
  schedule: string;
  testName?: string;
  memo: boolean;
  memoText: string;
  operation: string;
  status: string;          // run / rest / pause / alarm / ongoing ...
  statusLabel: string;     // 대기 / 진행중 / 일시정지 / 알람 / 완료
  voltage: string;
  current: string;
  power: string;
  step: string;
  cycle: string;
  rly: string;

  // 기능 버전 필드
  dgv?: string;

  // 디자인 버전 필드
  powerOn?: boolean;
  chamber?: string;

  temp: string;
  humidity: string;
  cycles: number;
  activeCycles: number;
  time: string;

  // 🔹 Measure.CycleCount 추가 (백엔드 Integer cycleCount)
  cycleCount?: number;

  // 🔹 Step 기반(Info.StepNo / TotalStepCount) 표시용
  stepNo?: number;        // Info.StepNo
  totalSteps?: number;    // Info.TotalStepCount

  // 퍼블 추가 필드(있으면 사용)
  memoTotal?: string;

  // 셧다운 여부 (CSS 표시)
  shutdown?: boolean;

  // 메모 API 식별자
  eqpid?: string;
  channelIndex?: number;
  chamberIndex?: number;
}

interface ListProps {
  listData: ListItem[];
}

type StatusToken = 'rest' | 'ongoing' | 'stop' | 'alarm' | 'completion';

/**
 * CSS가 기대하는 상태 토큰으로 매핑
 *  - li[data-status="rest|ongoing|stop|alarm|completion"]
 *  - .status[data-status="rest|ongoing|stop|alarm|completion"]
 */
const mapStatusToCss = (
  status?: string,
  statusLabel?: string,
  operation?: string,          // 🔹 uiOperation 도 같이 참고
): StatusToken => {
  // 0) uiOperation 기반 우선 (PACK/CELL 공통)
  const op = (operation ?? '').toLowerCase();
  if (op === 'completion' || op === 'complete') return 'completion';

  // 1) 한글 라벨 우선
  if (statusLabel === '완료') return 'completion';
  if (statusLabel === '대기') return 'rest';
  if (statusLabel === '진행중') return 'ongoing';
  if (statusLabel === '일시정지') return 'stop';
  if (statusLabel === '알람') return 'alarm';

  // 2) 원시 status 값으로 보정
  const s = (status ?? '').toLowerCase();
  if (s === 'complete' || s === 'completion') return 'completion';
  if (s === 'rest') return 'rest';
  if (s === 'run' || s === 'ongoing') return 'ongoing';
  if (s === 'pause' || s === 'stop') return 'stop';
  if (s === 'alarm') return 'alarm';

  // 기본값: 대기
  return 'rest';
};

// 🔹 StepNo / TotalStepCount → 하단 동그라미 매핑
function getCycleVisual(item: ListItem): { totalDots: number; activeDots: number } {
  const total =
    typeof item.totalSteps === 'number' && item.totalSteps > 0
      ? item.totalSteps
      : 0;
  const step =
    typeof item.stepNo === 'number' && item.stepNo >= 0
      ? item.stepNo
      : 0;

  // ✅ 1순위: Step 정보가 있을 때
  if (total > 0) {
    const active = Math.max(0, Math.min(step, total)); // 0 ~ total
    return {
      totalDots: total,
      activeDots: active,
    };
  }

  // 🔁 2순위: step 정보 없으면 cycleCount 기준 fallback
  if (typeof item.cycleCount === 'number' && item.cycleCount > 0) {
    const totalDots = 5; // 디자인 기본 5개 고정
    const idx0 = item.cycleCount - 1;
    const activeDots = (idx0 % totalDots) + 1; // 1..5

    return { totalDots, activeDots };
  }

  // 🔁 3순위: 그래도 없으면 기존 cycles/activeCycles 사용
  return {
    totalDots: item.cycles ?? 0,
    activeDots: item.activeCycles ?? 0,
  };
}

export default function List({ listData }: ListProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<ListItem | null>(null);
  const [selectedMemo, setSelectedMemo] = React.useState<ListItem | null>(null);

  // 메모 textarea 값 & 저장 상태
  const [text, setText] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);

  // 스낵바(토스트)
  const [snOpen, setSnOpen] = React.useState(false);
  const [snText, setSnText] = React.useState('');
  const [snSev, setSnSev] = React.useState<'success' | 'error' | 'info'>('info');
  const showMsg = (
    msg: string,
    sev: 'success' | 'error' | 'info' = 'info',
  ) => {
    setSnText(msg);
    setSnSev(sev);
    setSnOpen(true);
  };

  // 메모 UI 즉시 반영용: id → { memo, memoText }
  const [overrides, setOverrides] = React.useState<
    Record<number, { memo: boolean; memoText: string }>
  >({});

  // UL 사이즈 → 카드 위치 계산용
  const [ulSize, setUlSize] = React.useState<{ width: number; height: number }>(
    {
      width: 0,
      height: 0,
    },
  );
  const ulRef = React.useRef<HTMLUListElement | null>(null);

  const liWidth = ulSize.width * 0.1; // 한 줄 10개 기준

  React.useLayoutEffect(() => {
    if (!ulRef.current) return;

    const resize = () => {
      const rect = ulRef.current!.getBoundingClientRect();
      setUlSize({ width: rect.width, height: rect.height });
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // 렌더링 시 오버라이드 병합
  const withOverride = (item: ListItem): ListItem => {
    const ov = overrides[item.id];
    return ov ? { ...item, memo: ov.memo, memoText: ov.memoText } : item;
  };

  // 공통: 메모 API 식별자 확인
  const ensureIds = (
    item: ListItem | null,
  ): { eqpid: string; index: number } | null => {
    if (!item) {
      showMsg('선택된 항목이 없어 메모 API를 호출할 수 없습니다.', 'error');
      return null;
    }

    const eqpid = (item.eqpid || item.title || '').trim();

    // ✅ 메모 키는 "챔버 인덱스 우선"
    const index =
      typeof item.chamberIndex === 'number' && item.chamberIndex > 0
        ? item.chamberIndex
        : typeof item.channelIndex === 'number' && item.channelIndex > 0
          ? item.channelIndex
          : 0;

    if (!eqpid || index <= 0) {
      showMsg(
        `eqpid 또는 chamberIndex/channelIndex가 없어 메모 API를 호출할 수 없습니다.`,
        'error',
      );
      console.warn('Missing ids for memo API', { item, eqpid, index });
      return null;
    }

    return { eqpid, index };
  };

  // --- 모달 열기/닫기 (항상 편집 가능) ---
  const handleClickOpen = (raw: ListItem) => {
    console.log('[CLICK]', raw.eqpid, raw.chamberIndex, raw.channelIndex);

    const item = withOverride(raw);
    setSelectedItem(item);
    setSelectedMemo(item);
    // 디자인 버전: memoText가 없으면 memoTotal 표시
    setText(item.memoText ?? item.memoTotal ?? '');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
    setSelectedMemo(null);
    setText('');
  };

  // --- 메모 저장 (백엔드 upsert) ---
  const handleSave = async () => {
    const ids = ensureIds(selectedItem);
    if (!ids) return;

    try {
      setSaving(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/monitoring/memo`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            eqpid: ids.eqpid,
            // ✅ channel 파라미터 값 = chamberIndex (없으면 channelIndex)
            channel: ids.index,
            content: text,
            userId: 'web',
          }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const has = !!text.trim();

      if (selectedItem) {
        setOverrides(prev => ({
          ...prev,
          [selectedItem.id]: { memo: has, memoText: text },
        }));
      }

      handleClose();
      showMsg('메모가 저장되었습니다.', 'success');
    } catch (e: any) {
      console.error('메모 저장 실패', e);
      showMsg(`메모 저장 실패: ${e?.message ?? e}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- 메모 삭제 ---
  const handleDelete = async () => {
    const ids = ensureIds(selectedItem);
    if (!ids) return;

    try {
      setSaving(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/monitoring/memo?eqpid=${encodeURIComponent(
          ids.eqpid,
        )}&channel=${ids.index}`,
        { method: 'DELETE', credentials: 'include' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      if (selectedItem) {
        setOverrides(prev => ({
          ...prev,
          [selectedItem.id]: { memo: false, memoText: '' },
        }));
      }

      handleClose();
      showMsg('메모가 삭제되었습니다.', 'success');
    } catch (e: any) {
      console.error('메모 삭제 실패', e);
      showMsg(`메모 삭제 실패: ${e?.message ?? e}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* 퍼블 클래스/마크업 유지, 기능(클릭/메모/토스트) 그대로 */}
      <ul ref={ulRef} className="list">
        {listData.map(raw => {
          const item = withOverride(raw);

          // 🔹 StepNo / TotalStepCount 기반 하단 동그라미 계산
          const { totalDots, activeDots } = getCycleVisual(item);

          const x = item.x ?? 1;
          const y = item.y ?? 1;
          const left = (x - 1) * liWidth;
          const top = (y - 1) * 320; // 한 줄 높이(디자인 기준)

          // ✅ 칩(상단 뱃지)용 상태 토큰
          const chipStatus: StatusToken = mapStatusToCss(
            item.status,
            item.statusLabel,
            item.operation,   // ← uiOperation('completion', 'ongoing', 'stop', ...)
          );

          // ✅ 카드 테두리/배경용 상태 토큰
          // RESET 후 operation === 'available' 인 경우
          //   - 칩: 여전히 completion (파랑)
          //   - 카드: rest(회색 테두리/배경)
          const frameStatus: StatusToken =
            item.operation === 'available' ? 'rest' : chipStatus;

          return (
            <li
              key={item.id}
              data-operation={item.operation}
              data-checked={item.check ? 'checked' : undefined}
              data-shutdown={item.shutdown ? 'shutdown' : undefined}
              data-status={frameStatus}
              style={{ left: `${left}px`, top: `${top}px` }}
            >
              <div className="inner">
                <div className="topArea">
                  {/* 제목 클릭 시 메모 모달 오픈 */}
                  <h3 className="tit" onClick={() => handleClickOpen(item)}>
                    {item.title}-{item.chamberIndex}
                  </h3>
                  <div className="right">
                    {item.memo && (
                      <IconButton
                        className="btnMemo"
                        type="button"
                        aria-label="메모"
                        onClick={() => handleClickOpen(item)}
                      >
                        <Image src={IconMemo} alt="" />
                      </IconButton>
                    )}
                    <Chip
                      label={item.statusLabel}
                      className="status"
                      data-status={chipStatus}
                    />
                  </div>
                </div>

                {/* 숫자/상태 영역 – 디자인 버전 구조 유지 + powerOn, chamber 반영 */}
                <div className="bodyArea">
                  <dl>
                    <dt>전압</dt>
                    <dd>{item.voltage}</dd>
                  </dl>
                  <dl>
                    <dt>전류</dt>
                    <dd>{item.current}</dd>
                  </dl>
                  <dl className={item.powerOn ? 'on' : ''}>
                    <dt>파워</dt>
                    <dd>{item.power}</dd>
                  </dl>
                  <dl>
                    <dt>
                      {item.operation === 'charge' ||
                      item.operation === 'discharge'
                        ? '스텝'
                        : '스텝'}
                    </dt>
                    <dd>{item.step}</dd>
                  </dl>
                  <dl>
                    <dt>사이클</dt>
                    <dd>{item.cycleCount}</dd>
                  </dl>
                  <dl>
                    <dt>RLY</dt>
                    <dd>{item.rly}</dd>
                  </dl>
                  <dl>
                    <dt>
                      챔버<small>현재/설정</small>
                    </dt>
                    <dd>{item.chamber || '-'}</dd>
                  </dl>
                  <dl>
                    <dt>
                      칠러<small>현재/유량</small>
                    </dt>
                    <dd>{item.temp}</dd>
                  </dl>
                  <dl>
                    <dt>
                      습도<small>현재/설정</small>
                    </dt>
                    <dd>{item.humidity}</dd>
                  </dl>
                </div>

                <div className="bottomArea">
                  {/* 🔹 Step 기반 cycles 시각화 */}
                  <ol className="cycle" data-cycle={totalDots}>
                    {Array.from({ length: totalDots }).map((_, idx) => (
                      <li
                        key={idx}
                        className={idx < activeDots ? 'isActive' : ''}
                      />
                    ))}
                  </ol>
                  <dl className="time">
                    <dt>경과시간</dt>
                    <dd>{item.time}</dd>
                  </dl>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* 클릭 모달 — 퍼블 레이아웃 유지 + 기능 버튼 동작 */}
      <Dialog
        className="dialogCont"
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
      >
        <div className="modalWrapper dtlInfo">
          <DialogTitle className="tit" id="alert-dialog-title">
            {selectedItem ? selectedItem.title : '메모'}
            <span className="right">
              <IconButton
                className="btnClose"
                aria-label="닫기"
                onClick={handleClose}
              >
                <CloseIcon />
              </IconButton>
            </span>
          </DialogTitle>
          <DialogContent className="contents">
            <dl>
              <dt>
                <h5 className="tit">시험명</h5>
              </dt>
              <dd>
                <p>{selectedMemo?.testName}</p>
              </dd>
            </dl>

            <dl className="memoTotal">
              <dt>
                <h5 className="tit">MEMO</h5>
              </dt>
              <dd>
                <div className="memoTextarea">
                  <textarea
                    placeholder="메모 입력 영역"
                    rows={5}
                    value={text}
                    onChange={e => setText(e.target.value)}
                  />
                  <div className="btnWrap">
                    <button
                      type="button"
                      className="btnDel"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      <span>삭제</span>
                    </button>
                    <button
                      type="button"
                      className="btnConfirm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <span>{saving ? '저장중...' : '저장'}</span>
                    </button>
                  </div>
                </div>
              </dd>
            </dl>
          </DialogContent>
        </div>
      </Dialog>

      {/* Snackbar 토스트 */}
      <Snackbar
        open={snOpen}
        autoHideDuration={2500}
        onClose={() => setSnOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnOpen(false)}
          severity={snSev}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snText}
        </Alert>
      </Snackbar>
    </>
  );
}
