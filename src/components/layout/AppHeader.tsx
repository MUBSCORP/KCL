'use client';

import HeaderLogoArea from '@/app/uiux/components/layout/HeaderLogoArea';
import HeaderTabArea from '@/app/uiux/components/layout/HeaderTabArea';
import HeaderUtilArea from '@/app/uiux/components/layout/HeaderUtilArea';

export default function Header() {
  return (
    <header>
      <div className="innerWrap">
        <HeaderLogoArea />
        <HeaderTabArea />
        <HeaderUtilArea />
      </div>
    </header>
  );
}
