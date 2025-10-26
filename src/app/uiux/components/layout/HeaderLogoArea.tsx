'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@mui/material';
import logo from '@/assets/images/common/logo.png';

export default function HeaderLogoArea() {
  return (
    <div className="logoArea">
      <h1 className="logo">
        <Button className="customBtn">
          <Image src={logo} alt="KCL Cell/Pack 통합 모니터링 Korea Conformity Laboratories" priority />
        </Button>
      </h1>
    </div>
  );
}
