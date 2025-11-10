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
  memo: boolean;
  memoText: string;
  operation: string;
  status: string;
  statusLabel: string;
  voltage: string;
  current: string;
  power: string;
  step: string;
  cycle: string;
  rly: string;
  dgv: string;
  temp: string;
  humidity: string;
  cycles: number;
  activeCycles: number;
  time: string;

  // 퍼블 쪽에서 추가된 필드 (필요 시 사용)
  memoTotal?: string;

  // 🔹 퍼블 신규 속성: 셧다운 여부 (테두리 점등 등 CSS용)
  shutdown?: boolean;

  // 메모 API 식별자 (백엔드 연동용)
  eqpid?: string;
  channelIndex?: number;
}

interface ListProps {
  listData: ListItem[];
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
  const showMsg = (msg: string, sev: 'success' | 'error' | 'info' = 'info') => {
    setSnText(msg);
    setSnSev(sev);
    setSnOpen(true);
  };

  // 메모 UI 즉시 반영용: id → { memo, memoText }
  const [overrides, setOverrides] = React.useState<
    Record<number, { memo: boolean; memoText: string }>
  >({});

  // UL 사이즈 → 카드 위치 계산용
  const [ulSize, setUlSize] = React.useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
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
  ): { eqpid: string; channel: number } | null => {
    if (!item?.eqpid || item.channelIndex == null) {
      showMsg('eqpid/channelIndex가 없어 메모 API를 호출할 수 없습니다.', 'error');
      console.warn('Missing ids for memo API', item);
      return null;
    }
    return { eqpid: item.eqpid, channel: item.channelIndex };
  };

  // --- 모달 열기/닫기 (클릭 전용, 항상 편집 가능) ---
  const handleClickOpen = (raw: ListItem) => {
    const item = withOverride(raw);
    setSelectedItem(item);
    setSelectedMemo(item);
    setText(item.memoText || '');
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
            channel: ids.channel,
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
        )}&channel=${ids.channel}`,
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
      <ul ref={ulRef} className="list">
        {listData.map(raw => {
          const item = withOverride(raw);
          const x = item.x ?? 1;
          const y = item.y ?? 1;
          const left = (x - 1) * liWidth;
          const top = (y - 1) * 416; // 한 줄 높이(디자인 기준)

          return (
            <li
              key={item.id}
              data-operation={item.operation}
              data-checked={item.check ? 'checked' : undefined}
              // 🔹 퍼블 디자인 반영: shutdown 상태용 data-shutdown
              data-shutdown={item.shutdown ? 'shutdown' : undefined}
              style={{
                left: `${left}px`,
                top: `${top}px`,
              }}
            >
              <div className="inner">
                <div className="topArea">
                  {/* 제목 클릭 시 메모 모달 오픈 */}
                  <h3 className="tit" onClick={() => handleClickOpen(item)}>
                    {item.title}
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
                      data-status={item.status}
                    />
                  </div>
                </div>

                <div className="bodyArea">
                  <dl>
                    <dt>전압</dt>
                    <dd>{item.voltage}</dd>
                  </dl>
                  <dl>
                    <dt>전류</dt>
                    <dd>{item.current}</dd>
                  </dl>
                  <dl>
                    <dt>파워</dt>
                    <dd>{item.power}</dd>
                  </dl>
                  <dl>
                    <dt>
                      {item.operation === 'charge' || item.operation === 'discharge'
                        ? 'S'
                        : '스텝'}
                    </dt>
                    <dd>{item.step}</dd>
                  </dl>
                  <dl>
                    <dt>사이클</dt>
                    <dd>{item.cycle}</dd>
                  </dl>
                  <dl>
                    <dt>RLY</dt>
                    <dd>{item.rly}</dd>
                  </dl>
                  <dl>
                    <dt>DGV</dt>
                    <dd>{item.dgv}</dd>
                  </dl>
                  <dl>
                    <dt>
                      온도<small>현재/설정</small>
                    </dt>
                    <dd>{item.temp}</dd>
                  </dl>
                  <dl>
                    <dt>
                      습도<small>현재/한계</small>
                    </dt>
                    <dd>{item.humidity}</dd>
                  </dl>
                </div>

                <div className="bottomArea">
                  <ol className="cycle" data-cycle={item.cycles}>
                    {[...Array(5)].map((_, idx) => (
                      <li
                        key={idx}
                        className={idx < item.activeCycles ? 'isActive' : ''}
                      >
                        <span>Cycle {idx + 1}</span>
                      </li>
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

      {/* 클릭 모달 - 항상 편집 가능, 저장/삭제 버튼 사용 */}
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
              <IconButton className="btnClose" aria-label="닫기" onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </span>
          </DialogTitle>
          <DialogContent className="contents">
            <dl>
              <dt>
                <h5 className="tit">스케쥴명</h5>
              </dt>
              <dd>
                <p>{selectedMemo?.schedule}</p>
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