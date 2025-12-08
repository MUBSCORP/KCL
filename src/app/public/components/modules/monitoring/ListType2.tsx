'use client';

import React, { useState, useLayoutEffect, useRef } from 'react';
import {
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface MemoText {
  ch: string;        // CH 번호
  status: string;    // backend에서 내려주는 채널 상태 (ongoing / stop / completion / available 등)
  statusText: string; // 뱃지 표시용 한글 텍스트
  text: string;      // 시료명
  text2: string;     // 시험항목명 (예: TestName (CellTemp))
}

export interface ListItem {
  id: number;
  x: number;
  y: number;

  title: string;
  check: boolean;
  ready: boolean;
  shutdown: boolean;

  operation: string; // available / ongoing / stop / completion
  icon: string;
  temp1: string;
  temp2: string;

  ch1: number;
  ch2: number;
  ch3: number;

  memo: boolean;
  memoText: MemoText[];
  memoTotal: string;

  // 메모 API 식별자 (PACK 과 동일, 선택)
  eqpid?: string;
  channelIndex?: number;
}

interface ListProps {
  listData: ListItem[];
  /** 팝업 닫을 때 장비별 RESET 규칙 적용용 콜백 (선택) */
  onResetByDetail?: (item: ListItem) => void;
  canEditMemo: boolean;              // 🔹 추가
}

/** 채널 상태(status) → CSS 토큰 매핑 (chip 용) */
const mapChannelStatusToCss = (
  status: string,
): 'ongoing' | 'stop' | 'completion' | 'available' => {
  if (status === 'ongoing') return 'ongoing';
  if (status === 'stop') return 'stop';
  if (status === 'completion') return 'completion';
  return 'available';
};

export default function List({ listData, onResetByDetail, canEditMemo }: ListProps) {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);

  // 메모 입력값
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  // 토스트
  const [snOpen, setSnOpen] = useState(false);
  const [snText, setSnText] = useState('');
  const [snSev, setSnSev] = useState<'success' | 'error' | 'info'>('info');

  const showMsg = (
    msg: string,
    sev: 'success' | 'error' | 'info' = 'info',
  ) => {
    setSnText(msg);
    setSnSev(sev);
    setSnOpen(true);
  };

  // 메모 즉시 반영용 override (id 기준)
  const [overrides, setOverrides] = useState<
    Record<number, { memo: boolean; memoTotal: string }>
  >({});

  const [ulSize, setUlSize] = useState({ width: 0, height: 0 });
  const ulRef = useRef<HTMLUListElement | null>(null);

  useLayoutEffect(() => {
    if (!ulRef.current) return;

    const resize = () => {
      if (!ulRef.current) return;
      const rect = ulRef.current.getBoundingClientRect();
      setUlSize({ width: rect.width, height: rect.height });
    };

    const timer = setTimeout(resize, 0);
    window.addEventListener('resize', resize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // 퍼블 기준 liWidth (14칸)
  const liWidth = ulSize.width * 0.0714285;

  const withOverride = (item: ListItem): ListItem => {
    const ov = overrides[item.id];
    return ov ? { ...item, memo: ov.memo, memoTotal: ov.memoTotal } : item;
  };

  // 메모 API 식별자 체크
  const ensureIds = (
    item: ListItem | null,
  ): { eqpid: string; channel: number } | null => {
    if (!item?.eqpid || item.channelIndex == null) {
      showMsg('eqpid / channelIndex 가 없어 메모 저장이 불가합니다.', 'error');
      console.warn('[CELL] missing eqpid/channelIndex for memo API', item);
      return null;
    }
    if (!canEditMemo) {
      showMsg('메모 저장/삭제 권한이 없습니다.', 'error');
      return null;
    }

    return { eqpid: item.eqpid, channel: item.channelIndex };
  };

  const handleClickOpen = (raw: ListItem) => {
    const item = withOverride(raw);
    setSelectedItem(item);
    setText(item.memoTotal || '');
    setOpen(true);
  };

  const handleClose = () => {
    // ✅ 팝업 닫을 때 RESET 규칙 적용 콜백 호출
    if (selectedItem && onResetByDetail) {
      onResetByDetail(selectedItem);
    }

    setOpen(false);
    setSelectedItem(null);
    setText('');
  };

  // 메모 저장
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
          [selectedItem.id]: { memo: has, memoTotal: text },
        }));
      }

      showMsg('메모가 저장되었습니다.', 'success');
      handleClose();
    } catch (e: any) {
      console.error('[CELL] memo save failed', e);
      showMsg(`메모 저장 실패: ${e?.message ?? e}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // 메모 삭제
  const handleDelete = async () => {
    const ids = ensureIds(selectedItem);
    if (!ids) return;

    try {
      setSaving(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/monitoring/memo?eqpid=${encodeURIComponent(
          ids.eqpid,
        )}&channel=${ids.channel}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      if (selectedItem) {
        setOverrides(prev => ({
          ...prev,
          [selectedItem.id]: { memo: false, memoTotal: '' },
        }));
      }

      showMsg('메모가 삭제되었습니다.', 'success');
      handleClose();
    } catch (e: any) {
      console.error('[CELL] memo delete failed', e);
      showMsg(`메모 삭제 실패: ${e?.message ?? e}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ul className="list" ref={ulRef}>
        {ulSize.width > 0 &&
          listData.map(raw => {
            const item = withOverride(raw);
            const left = (item.x - 1) * liWidth;
            const top = (item.y - 1) * 116;

            return (
              <li
                key={item.id}
                data-operation={item.operation}
                data-checked={item.check ? 'checked' : undefined}
                data-ready={item.ready ? 'ready' : undefined}
                data-shutdown={item.shutdown ? 'shutdown' : undefined}
                onClick={() => handleClickOpen(item)} // 메모 존재 여부와 관계없이 상세 오픈
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                }}
              >
                <div className="inner">
                  <div className="topArea">
                    <h3 className="tit">{item.title}</h3>
                  </div>
                  <div className="bodyArea">
                    <ul>
                      <li>{item.ch1}</li>
                      <li>{item.ch2}</li>
                      <li>{item.ch3}</li>
                    </ul>
                  </div>
                  <div className="bottomArea">
                    <i className={item.icon} />
                    <span>{item.temp1 || '-'}</span>
                    <em>/</em>
                    <strong>{item.temp2 || '-'}</strong>
                  </div>
                </div>
              </li>
            );
          })}
      </ul>

      {/* 상세 + 메모 모달 */}
      <Dialog
        className="dialogCont"
        open={open}
        onClose={handleClose}
        aria-labelledby="memo-dialog-title"
      >
        <div className="modalWrapper dtlInfo">
          <DialogTitle className="tit" id="memo-dialog-title">
            {selectedItem?.title}
            <div className="right">
              <span className="temp">
                {selectedItem?.temp1}
                <span>/</span>
                <strong>{selectedItem?.temp2}</strong>
              </span>
              <IconButton
                className="btnClose"
                aria-label="닫기"
                onClick={handleClose}
              >
                <CloseIcon />
              </IconButton>
            </div>
          </DialogTitle>

          <DialogContent className="contents">
            {/* 채널 리스트 */}
            {selectedItem?.memoText.map((memo, idx) => (
              <div key={idx} className="infoItem">
                <dl>
                  <dt>
                    <strong>{memo.ch}</strong>
                    <span
                      className="chip"
                      data-type={mapChannelStatusToCss(memo.status)}
                    >
                      {memo.statusText}
                    </span>
                  </dt>
                  <dd>
                    <p>
                      <strong>시료:</strong> {memo.text}
                    </p>
                    <p>
                      <strong>시험항목:</strong> {memo.text2}
                    </p>
                  </dd>
                </dl>
              </div>
            ))}

            {/* 메모 입력 영역 */}
            <dl className="memoTotal">
              <dt>Memo</dt>
              <dd>
                <div className="memoTextarea">
                  <textarea
                    placeholder="메모 입력 영역"
                    rows={5}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    readOnly={!canEditMemo}
                  />
                  <div className="btnWrap">
                    <button
                      type="button"
                      className="btnDel"
                      onClick={handleDelete}
                      disabled={saving || !canEditMemo}
                    >
                      <span>삭제</span>
                    </button>
                    <button
                      type="button"
                      className="btnMod"
                      onClick={handleSave}
                      disabled={saving || !canEditMemo}
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