'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@mui/material';
import fallbackLogo from '@/assets/images/common/logo.png';

export default function HeaderLogoArea() {
  const [bust] = useState(() => Date.now()); // ✅ 페이지 로드 시 1번만 바뀜(무한 요청 방지)

  const remoteLogoUrl = useMemo(() => {
    const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
    const path = process.env.NEXT_PUBLIC_LOGO_URL || '';
    if (!base || !path) return '';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}?v=${bust}`; // ✅ 캐시 깨기
  }, [bust]);

  const [src, setSrc] = useState<string>(remoteLogoUrl);

  return (
    <div className="logoArea">
      <h1 className="logo">
        <Link href="/" aria-label="KCL Cell/Pack 통합 모니터링 메인으로 이동">
          <Button className="customBtn">
            <Image
              src={src || fallbackLogo}
              alt="KCL Cell/Pack 통합 모니터링 Korea Conformity Laboratories"
              priority
              width={180}
              height={40}
              onError={() => setSrc('')}
            />
          </Button>
        </Link>
      </h1>
    </div>
  );
}
