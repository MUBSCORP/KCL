'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@mui/material';
import logo from '@/assets/images/common/logo.png';

export default function HeaderLogoArea() {
  return (
    <div className="logoArea">
      <h1 className="logo">
        <Link href="/" aria-label="KCL Cell/Pack 통합 모니터링 메인으로 이동">
          <Button className="customBtn">
            <Image
              src={logo}
              alt="KCL Cell/Pack 통합 모니터링 Korea Conformity Laboratories"
              priority
            />
          </Button>
        </Link>
      </h1>
    </div>
  );
}
