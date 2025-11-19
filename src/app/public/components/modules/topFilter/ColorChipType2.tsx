// ColorChipType2.tsx
'use client';

import { Button } from '@mui/material';
import Image from 'next/image';

import BtnReset from '@/assets/images/icon/reset.png';
import chip_03 from '@/assets/images/icon/chip_03.png';
import chip_04 from '@/assets/images/icon/chip_04.png';
import chip_05 from '@/assets/images/icon/chip_05.png';
import chip_06 from '@/assets/images/icon/chip_06.png';
import chip_07 from '@/assets/images/icon/chip_07.png';
import chip_08 from '@/assets/images/icon/chip_08.png';

type ColorChipType2Props = {
  onReset?: () => void;
};

export default function ColorChipType2({ onReset }: ColorChipType2Props) {
  return (
    <>
      <ul className="colorChip">
        <li>
          <Image src={chip_03} alt="" />
          진행중
        </li>
        <li>
          <Image src={chip_04} alt="" />
          채널 일부 종료
        </li>
        <li>
          <Image src={chip_05} alt="" />
          일시정지
        </li>
        <li>
          <Image src={chip_06} alt="" />
          알람
        </li>
        <li>
          <Image src={chip_07} alt="" />
          완료
        </li>
        <li>
          <Image src={chip_08} alt="" />
          대기
        </li>
      </ul>
      <Button className="btnReset" onClick={onReset}>
        <span>RESET</span>
        <Image src={BtnReset} alt="초기화" width={16} height={16} />
      </Button>
    </>
  );
}
