'use client';

import React from 'react';
import { IconButton, Chip, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Image from 'next/image';
import IconMemo from '@/assets/images/icon/memo.png';
import CloseIcon from '@mui/icons-material/Close';

interface ListItem {
  id: number;
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
}

interface ListProps {
  listData: ListItem[];
}

export default function List({ listData }: ListProps) {
  // Dialog memo
  const [open, setOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<ListItem | null>(null);
  const [selectedMemo, setSelectedMemo] = React.useState<ListItem | null>(null);

  const handleClickOpen = (item: ListItem) => {
    setSelectedItem(item);
    setSelectedMemo(item);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
    setSelectedMemo(null);
  };

  const [hoverOpen, setHoverOpen] = React.useState(false);

  const handleHoverOpen = (item: ListItem) => {
    setSelectedItem(item);
    setSelectedMemo(item);
    setHoverOpen(true);
  };

  const handleHoverClose = () => {
    setHoverOpen(false);
    setSelectedItem(null);
    setSelectedMemo(null);
  };

  return (
    <>
      <ul className="list">
        {listData.map((item) => (
          <li key={item.id} data-operation={item.operation} data-checked={item.check ? 'checked' : undefined}>
            {/* 상단 영역 */}
            <div className="topArea">
              <h3 className="tit" onMouseEnter={() => handleHoverOpen(item)}>
                {item.title}
              </h3>
              <div className="right">
                {item.memo && (
                  <IconButton className="btnMemo" type="button" aria-label="메모" onClick={() => handleClickOpen(item)}>
                    <Image src={IconMemo} alt="" />
                  </IconButton>
                )}
                <Chip label={item.statusLabel} className="status" data-status={item.status} />
              </div>
            </div>

            {/* 본문 영역 */}
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
                <dt>{item.operation === 'charge' || item.operation === 'discharge' ? 'S' : '스텝'}</dt>
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

            {/* 하단 영역 */}
            <div className="bottomArea">
              <ol className="cycle" data-cycle={item.cycles}>
                {[...Array(5)].map((_, idx) => (
                  <li key={idx} className={idx < item.activeCycles ? 'isActive' : ''}>
                    <span>Cycle {idx + 1}</span>
                  </li>
                ))}
              </ol>
              <dl className="time">
                <dt>경과시간</dt>
                <dd>{item.time}</dd>
              </dl>
            </div>
          </li>
        ))}
      </ul>
      {/* modal hover title */}
      <Dialog className="dialogCont" open={hoverOpen} onClose={handleHoverClose} PaperProps={{ onMouseLeave: handleHoverClose }}>
        <div className="modalWrapper dtlInfo">
          <DialogTitle className="tit">{selectedItem?.title}</DialogTitle>
          <DialogContent className="contents">
            <dl>
              <dt>
                <h5 className="tit">스케쥴명</h5>
              </dt>
              <dd>
                <p>{selectedMemo?.schedule}</p>
              </dd>
            </dl>
            <dl>
              <dt>
                <h5 className="tit">MEMO</h5>
              </dt>
              <dd>
                <p>{selectedMemo?.memoText}</p>
              </dd>
            </dl>
          </DialogContent>
        </div>
      </Dialog>

      {/* modal click memo */}
      <Dialog className="dialogCont" open={open} onClose={handleClose} aria-labelledby="alert-dialog-title">
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
            <dl>
              <dt>
                <h5 className="tit">MEMO</h5>
              </dt>
              <dd>
                <p>{selectedMemo?.memoText}</p>
              </dd>
            </dl>
          </DialogContent>
          <DialogActions className="bottom">
            <Button className="negative" onClick={handleClose}>
              메모삭제
            </Button>
            <Button className="positive" onClick={handleClose}>
              메모수정
            </Button>
            <Button className="positive" onClick={handleClose}>
              메모추가
            </Button>
          </DialogActions>
        </div>
      </Dialog>
    </>
  );
}
