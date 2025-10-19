'use client';

import { Button } from '@mui/material';
import TopStateCenterResult from './TopStateCenterResult';
import TopStateCenterList from './TopStateCenterList';

export default function TopStateCenter() {
  return (
    <>
      <h3 className="tit">
        <span>
          <i />
          실시간 이벤트 로근 & 알림
        </span>
        <Button className="customBtn">more</Button>
      </h3>
      <div className="innerWrap">
        <TopStateCenterList />
        <TopStateCenterResult />
      </div>
    </>
  );
}
