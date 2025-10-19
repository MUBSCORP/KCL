'use client';

import { Button } from '@mui/material';

export default function HeaderUtilArea() {
  return (
    <div className="utilArea">
      <p className="user">
        <strong>홍길동</strong>사원
      </p>
      <p className="position">
        KLC PACK 관리자
        <span className="tag">온라인</span>
      </p>
      <div className="btn">
        <Button className="customBtn">
          <span>로그아웃</span>
        </Button>
      </div>
    </div>
  );
}
