'use client';

import React from 'react';
import { IconButton, Chip, Dialog, DialogContent, DialogTitle, Snackbar, Alert } from '@mui/material';
import Image from 'next/image';
import IconMemo from '@/assets/images/icon/memo.png';
import CloseIcon from '@mui/icons-material/Close';

interface ListItem {
  id: number;

  x?: number;
  y?: number;

  title: string;
  check: boolean;
  schedule: string;
  testName?: string;

  memo: boolean;
  memoText: string;

  operation: string; // available / ongoing / stop / completion ...
  status: string;
  statusLabel: string;

  voltage: string;
  current: string;
  power: string;
  step: string;
  cycle: string;
  rly: string;

  dgv?: string;

  powerOn?: boolean;
  chamber?: string;

  temp: string;
  humidity: string;
  cycles: number;
  activeCycles: number;
  time: string;

  cycleCount?: string;

  stepNo?: number;
  totalSteps?: number;

  memoTotal?: string;

  shutdown?: boolean;

  eqpid?: string;
  channelIndex?: number;
  chamberIndex?: number;
}

interface ListProps {
  listData: ListItem[];
  canEditMemo: boolean;
}

type StatusToken = 'rest' | 'ongoing' | 'stop' | 'alarm' | 'completion';

const mapStatusToCss = (status?: string, statusLabel?: string, operation?: string): StatusToken => {
  const op = (operation ?? '').toLowerCase();
  if (op === 'completion' || op === 'complete') return 'completion';

  if (statusLabel === '완료') return 'completion';
  if (statusLabel === '대기') return 'rest';
  if (statusLabel === '진행중') return 'ongoing';
  if (statusLabel === '일시정지') return 'stop';
  if (statusLabel === '알람') return 'alarm';

  const s = (status ?? '').toLowerCase();
  if (s === 'complete' || s === 'completion') return 'completion';
  if (s === 'rest') return 'rest';
  if (s === 'run' || s === 'ongoing') return 'ongoing';
  if (s === 'pause' || s === 'stop') return 'stop';
  if (s === 'alarm') return 'alarm';

  return 'rest';
};

function getCycleVisual(item: ListItem): { totalDots: number; activeDots: number } {
  const total = typeof item.totalSteps === 'number' && item.totalSteps > 0 ? item.totalSteps : 0;
  const step = typeof item.stepNo === 'number' && item.stepNo >= 0 ? item.stepNo : 0;

  if (total > 0) {
    const active = Math.max(0, Math.min(step, total));
    return { totalDots: total, activeDots: active };
  }

  const cc = typeof item.cycleCount === 'string' ? Number(item.cycleCount) : (item.cycleCount as any);
  if (Number.isFinite(cc) && cc > 0) {
    const totalDots = 5;
    const idx0 = cc - 1;
    const activeDots = (idx0 % totalDots) + 1;
    return { totalDots, activeDots };
  }

  return {
    totalDots: item.cycles ?? 0,
    activeDots: item.activeCycles ?? 0,
  };
}

type OverrideState = {
  memo: boolean;
  memoText: string;

  // ✅ 모달 닫을 때 “그 카드만 완료→대기(1회성)”
  forceRest?: boolean;
};

export default function List({ listData, canEditMemo }: ListProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<ListItem | null>(null);
  const [selectedMemo, setSelectedMemo] = React.useState<ListItem | null>(null);

  const [text, setText] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);

  const [snOpen, setSnOpen] = React.useState(false);
  const [snText, setSnText] = React.useState('');
  const [snSev, setSnSev] = React.useState<'success' | 'error' | 'info'>('info');
  const showMsg = (msg: string, sev: 'success' | 'error' | 'info' = 'info') => {
    setSnText(msg);
    setSnSev(sev);
    setSnOpen(true);
  };

  const [overrides, setOverrides] = React.useState<Record<number, OverrideState>>({});

  const [ulSize, setUlSize] = React.useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const ulRef = React.useRef<HTMLUListElement | null>(null);
  const liWidth = ulSize.width * 0.1;

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

  const withOverride = (item: ListItem): ListItem => {
    const ov = overrides[item.id];
    return ov ? { ...item, memo: ov.memo, memoText: ov.memoText } : item;
  };

  // ✅ 실데이터가 completion이 아닌 상태로 들어오면, forceRest 자동 해제 (영구 rest 방지)
  React.useEffect(() => {
    if (!listData?.length) return;

    setOverrides((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const raw of listData) {
        const ov = next[raw.id];
        if (!ov?.forceRest) continue;

        const base: StatusToken = mapStatusToCss(raw.status, raw.statusLabel, raw.operation);
        if (base !== 'completion') {
          next[raw.id] = { ...ov, forceRest: false };
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [listData]);

  const ensureIds = (item: ListItem | null): { eqpid: string; index: number } | null => {
    if (!item) {
      showMsg('선택된 항목이 없어 메모 API를 호출할 수 없습니다.', 'error');
      return null;
    }
    if (!canEditMemo) {
      showMsg('메모 저장/삭제 권한이 없습니다.', 'error');
      return null;
    }

    const eqpid = (item.eqpid || item.title || '').trim();
    const index =
      typeof item.chamberIndex === 'number' && item.chamberIndex > 0
        ? item.chamberIndex
        : typeof item.channelIndex === 'number' && item.channelIndex > 0
          ? item.channelIndex
          : 0;

    if (!eqpid || index <= 0) {
      showMsg('eqpid 또는 chamberIndex/channelIndex가 없어 메모 API를 호출할 수 없습니다.', 'error');
      console.warn('Missing ids for memo API', { item, eqpid, index });
      return null;
    }

    return { eqpid, index };
  };

  const handleClickOpen = (raw: ListItem) => {
    const item = withOverride(raw);
    setSelectedItem(item);
    setSelectedMemo(item);
    setText(item.memoText ?? item.memoTotal ?? '');
    setOpen(true);
  };

  const handleClose = () => {
    // ✅ 모달 닫기: 열었던 카드가 completion이면 그 카드만 1회성 rest 표시
    if (selectedItem) {
      const base: StatusToken = mapStatusToCss(selectedItem.status, selectedItem.statusLabel, selectedItem.operation);

      if (base === 'completion') {
        setOverrides((prev) => ({
          ...prev,
          [selectedItem.id]: {
            memo: prev[selectedItem.id]?.memo ?? selectedItem.memo,
            memoText: prev[selectedItem.id]?.memoText ?? selectedItem.memoText,
            forceRest: true,
          },
        }));
      }
    }

    setOpen(false);
    setSelectedItem(null);
    setSelectedMemo(null);
    setText('');
  };

  const handleSave = async () => {
    const ids = ensureIds(selectedItem);
    if (!ids) return;

    try {
      setSaving(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/monitoring/memo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eqpid: ids.eqpid,
          channel: ids.index,
          content: text,
          userId: 'web',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const has = !!text.trim();

      if (selectedItem) {
        setOverrides((prev) => ({
          ...prev,
          [selectedItem.id]: {
            ...prev[selectedItem.id],
            memo: has,
            memoText: text,
          },
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

  const handleDelete = async () => {
    const ids = ensureIds(selectedItem);
    if (!ids) return;

    try {
      setSaving(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/monitoring/memo?eqpid=${encodeURIComponent(ids.eqpid)}&channel=${ids.index}`,
        { method: 'DELETE', credentials: 'include' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      if (selectedItem) {
        setOverrides((prev) => ({
          ...prev,
          [selectedItem.id]: {
            ...prev[selectedItem.id],
            memo: false,
            memoText: '',
          },
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
      <ul ref={ulRef} className="list">
        {listData.map((raw) => {
          const item = withOverride(raw);

          const { totalDots, activeDots } = getCycleVisual(item);

          const x = item.x ?? 1;
          const y = item.y ?? 1;
          const left = (x - 1) * liWidth;
          const top = (y - 1) * 320;

          const ov = overrides[item.id];
          const baseChipStatus: StatusToken = mapStatusToCss(item.status, item.statusLabel, item.operation);

          // ✅ 모달 닫기 forceRest는 “완료일 때만” rest로 잠깐 보여준다
          const isRestForced = !!ov?.forceRest && baseChipStatus === 'completion';

          const chipStatus: StatusToken = isRestForced ? 'rest' : baseChipStatus;
          const frameStatus: StatusToken = isRestForced ? 'rest' : baseChipStatus;
          const chipLabel = isRestForced ? '대기' : item.statusLabel;

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
                  <h3 className="tit" onClick={() => handleClickOpen(item)}>
                    {item.title}-{item.chamberIndex}
                  </h3>
                  <div className="right">
                    {item.memo && (
                      <IconButton className="btnMemo" type="button" aria-label="메모" onClick={() => handleClickOpen(item)}>
                        <Image src={IconMemo} alt="" />
                      </IconButton>
                    )}
                    <Chip label={chipLabel} className="status" data-status={chipStatus} />
                  </div>
                </div>

                <div className="bodyArea">
                  <dl><dt>전압</dt><dd>{item.voltage}</dd></dl>
                  <dl><dt>전류</dt><dd>{item.current}</dd></dl>
                  <dl className={item.powerOn ? 'on' : ''}><dt>전력</dt><dd>{item.power}</dd></dl>
                  <dl><dt>스텝</dt><dd>{item.step}</dd></dl>
                  <dl><dt>사이클</dt><dd>{item.cycleCount}</dd></dl>
                  <dl><dt>RLY</dt><dd>{item.rly}</dd></dl>
                  <dl>
                    <dt>챔버<small>현재/설정</small></dt>
                    <dd>{item.chamber || '-'}</dd>
                  </dl>
                  <dl>
                    <dt>칠러<small>현재/유량</small></dt>
                    <dd>{item.temp}</dd>
                  </dl>
                  <dl>
                    <dt>습도<small>현재/설정</small></dt>
                    <dd>{item.humidity}</dd>
                  </dl>
                </div>

                <div className="bottomArea">
                  <ol className="cycle" data-cycle={totalDots}>
                    {Array.from({ length: totalDots }).map((_, idx) => (
                      <li key={idx} className={idx < activeDots ? 'isActive' : ''} />
                    ))}
                  </ol>
                  <dl className="time"><dt>경과시간</dt><dd>{item.time}</dd></dl>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog className="dialogCont" open={open} onClose={handleClose} aria-labelledby="alert-dialog-title"  transitionDuration={0}>
        <div className="modalWrapper dtlInfo">
          <DialogTitle className="tit" id="alert-dialog-title">
            {selectedItem ? selectedItem.title : '메모'}
            <span className="right">
              <IconButton className="btnClose" aria-label="닫기" onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </span>
          </DialogTitle>

          <DialogContent className="contents">
            <dl>
              <dt><h5 className="tit">시험명</h5></dt>
              <dd><p>{selectedMemo?.testName}</p></dd>
            </dl>

            <dl className="memoTotal">
              <dt><h5 className="tit">MEMO</h5></dt>
              <dd>
                <div className="memoTextarea">
                  <textarea
                    placeholder="메모 입력 영역"
                    rows={5}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    readOnly={!canEditMemo}
                  />
                  <div className="btnWrap">
                    <button type="button" className="btnDel" onClick={handleDelete} disabled={saving || !canEditMemo}>
                      <span>삭제</span>
                    </button>
                    <button type="button" className="btnConfirm" onClick={handleSave} disabled={saving || !canEditMemo}>
                      <span>{saving ? '저장중...' : '저장'}</span>
                    </button>
                  </div>
                </div>
              </dd>
            </dl>
          </DialogContent>
        </div>
      </Dialog>

      <Snackbar
        open={snOpen}
        autoHideDuration={2500}
        onClose={() => setSnOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSnOpen(false)} severity={snSev} variant="filled" sx={{ width: '100%' }}>
          {snText}
        </Alert>
      </Snackbar>
    </>
  );
}
