'use client';

import HeaderLogoArea from '@/app/public/components/layout/HeaderLogoArea';
import HeaderTabArea from '@/app/public/components/layout/HeaderTabArea';
import HeaderUtilArea from '@/app/public/components/layout/HeaderUtilArea';

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
