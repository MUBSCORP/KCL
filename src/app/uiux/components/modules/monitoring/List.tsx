'use client';

import React from 'react';
import { IconButton, Chip, Button, Dialog, DialogActions, DialogContent, DialogTitle, Menu, MenuItem } from '@mui/material';
import Image from 'next/image';
import IconMemo from '@/assets/images/icon/memo.png';
import CloseIcon from '@mui/icons-material/Close';

interface ListItem {
  id: number;
  x: number;
  y: number;
  title: string;
  check: boolean;
  shutdown: boolean;
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
  memoTotal?: string;
}

interface ListProps {
  listData: ListItem[];
}

export default function List({ listData }: ListProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<ListItem | null>(null);
  const [selectedMemo, setSelectedMemo] = React.useState<ListItem | null>(null);

  const [ulSize, setUlSize] = React.useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

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

  // const [hoverOpen, setHoverOpen] = React.useState(false);
  // const handleHoverOpen = (item: ListItem) => {
  //   setSelectedItem(item);
  //   setSelectedMemo(item);
  //   setHoverOpen(true);
  // };
  // const handleHoverClose = () => {
  //   setHoverOpen(false);
  //   setSelectedItem(null);
  //   setSelectedMemo(null);
  // };

  // const [menuPosition, setMenuPosition] = React.useState<{ mouseX: number; mouseY: number } | null>(null);

  // const handleContextMenu = (event: React.MouseEvent) => {
  //   event.preventDefault();
  //   setMenuPosition({
  //     mouseX: event.clientX + 2,
  //     mouseY: event.clientY - 6,
  //   });
  // };

  // const handleMenuClose = () => {
  //   setMenuPosition(null);
  // };

  // const handleEdit = () => {
  //   console.log('수정하기:', selectedMemo);
  //   handleMenuClose();
  // };

  // const handleDelete = () => {
  //   console.log('삭제하기:', selectedMemo);
  //   handleMenuClose();
  // };
  return (
    <>
      <ul ref={ulRef} className="list">
        {listData.map((item) => {
          const left = (item.x - 1) * liWidth;
          const top = (item.y - 1) * 416;

          return (
            <li
              key={item.id}
              data-operation={item.operation}
              data-checked={item.check ? 'checked' : undefined}
              data-shutdown={item.shutdown ? 'shutdown' : undefined}
              style={{
                left: `${left}px`,
                top: `${top}px`,
              }}
            >
              <div className="inner">
                <div className="topArea">
                  <h3 className="tit" onClick={() => handleClickOpen(item)}>
                    {item.title}
                  </h3>
                  <div className="right">
                    {item.memo && (
                      <IconButton className="btnMemo" type="button" aria-label="메모">
                        <Image src={IconMemo} alt="" />
                      </IconButton>
                    )}
                    <Chip label={item.statusLabel} className="status" data-status={item.status} />
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
              </div>
            </li>
          );
        })}
      </ul>

      {/* hover modal */}
      {/* <Dialog
        className="dialogCont"
        open={hoverOpen}
        onClose={handleHoverClose}
        PaperProps={{
          // 메뉴 열려있을 땐 닫지 않기
          onMouseLeave: () => {
            if (!menuPosition) handleHoverClose();
          },
          onContextMenu: handleContextMenu,
          style: { cursor: 'default' },
        }}
      >
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
            <dl className="memoTotal">
              <dt>
                <h5 className="tit">MEMO</h5>
              </dt>
              <dd>
                <div className="memoTextarea">
                  <textarea placeholder="메모를 입력하세요" rows={5} defaultValue={selectedItem?.memoText} disabled />
                  <button type="button" className="btnMod">
                    <span>수정</span>
                  </button>
                  <button type="button" className="btnDel">
                    <span>삭제</span>
                  </button>
                </div>
              </dd>
            </dl>
          </DialogContent>
        </div>
      </Dialog> */}

      {/* context */}
      {/* <Menu open={!!menuPosition} onClose={handleMenuClose} anchorReference="anchorPosition" anchorPosition={menuPosition ? { top: menuPosition.mouseY, left: menuPosition.mouseX } : undefined}>
        <MenuItem onClick={handleEdit}>수정</MenuItem>
        <MenuItem onClick={handleDelete}>삭제</MenuItem>
      </Menu> */}

      {/* click modal */}
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
            <dl className="memoTotal">
              <dt>
                <h5 className="tit">MEMO</h5>
              </dt>
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
              메모삭제
            </Button>
            <Button className="positive" onClick={handleClose}>
              메모수정
            </Button>
            <Button className="positive" onClick={handleClose}>
              메모추가
            </Button>
          </DialogActions> */}
        </div>
      </Dialog>
    </>
  );
}
