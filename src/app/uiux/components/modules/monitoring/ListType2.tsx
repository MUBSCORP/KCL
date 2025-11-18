'use client';

import React, { useState, useLayoutEffect, useRef } from 'react';
import { IconButton, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface MemoText {
  ch: string;
  status: string;
  statusText: string;
  text: string;
  text2: string;
}

interface ListItem {
  id: number;
  x: number;
  y: number;
  title: string;
  check: boolean;
  ready: boolean;
  shutdown: boolean;
  operation: string;
  icon: string;
  temp1: string;
  temp2: string;
  ch1: number;
  ch2: number;
  ch3: number;
  memo: boolean;
  memoText: MemoText[];
  memoTotal: string;
}

interface ListProps {
  listData: ListItem[];
}

export default function List({ listData }: ListProps) {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
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

  const handleClickOpen = (item: ListItem) => {
    setSelectedItem(item);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
  };

  // liWidth 계산
  const liWidth = ulSize.width * 0.0714285;

  return (
    <>
      <ul className="list" ref={ulRef}>
        {ulSize.width > 0 &&
          listData.map((item) => {
            const left = (item.x - 1) * liWidth;
            const top = (item.y - 1) * 116;

            return (
              <li
                key={item.id}
                data-operation={item.operation}
                data-checked={item.check ? 'checked' : undefined}
                data-ready={item.ready ? 'ready' : undefined}
                data-shutdown={item.shutdown ? 'shutdown' : undefined}
                onClick={() => item.memo && handleClickOpen(item)}
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
                    <span>{item.temp1}</span>
                    <em>/</em>
                    <strong>{item.temp2}</strong>
                  </div>
                </div>
              </li>
            );
          })}
      </ul>

      {/* Memo Dialog */}
      <Dialog className="dialogCont" open={open} onClose={handleClose} aria-labelledby="memo-dialog-title">
        <div className="modalWrapper dtlInfo">
          <DialogTitle className="tit" id="memo-dialog-title">
            {selectedItem?.title}
            <div className="right">
              <span className="temp">
                {selectedItem?.temp1}
                <span>/</span>
                <strong>{selectedItem?.temp2}</strong>
              </span>
              <IconButton className="btnClose" aria-label="닫기" onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </div>
          </DialogTitle>

          <DialogContent className="contents">
            {selectedItem?.memoText.map((memo, idx) => (
              <div key={idx} className="infoItem">
                <dl>
                  <dt>
                    <strong>{memo.ch}</strong>
                    <span className="chip" data-type={memo.status}>
                      {memo.statusText}
                    </span>
                  </dt>
                  <dd>
                    <p>
                      <strong>시험:</strong> {memo.text}
                    </p>
                    <p>
                      <strong>시험항목:</strong> {memo.text2}
                    </p>
                  </dd>
                </dl>
              </div>
            ))}
            <dl className="memoTotal">
              <dt>Memo</dt>
              <dd>
                <div className="memoTextarea">
                  <textarea placeholder="메모 입력 영역" rows={5} defaultValue={selectedItem?.memoTotal} readOnly />
                  <div className="btnWrap">
                    <button type="button" className="btnDel">
                      <span>삭제</span>
                    </button>
                    <button type="button" className="btnMod">
                      <span>수정</span>
                    </button>
                    <button type="button" className="btnConfirm">
                      <span>저장</span>
                    </button>
                  </div>
                </div>
              </dd>
            </dl>
          </DialogContent>

          {/* <DialogActions className="bottom">
            <Button className="negative" onClick={handleClose}>
              닫기
            </Button>
          </DialogActions> */}
        </div>
      </Dialog>
    </>
  );
}
