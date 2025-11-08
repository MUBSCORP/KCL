'use client';

import { Button } from '@mui/material';
import Image from 'next/image';
import BtnReset from '@/assets/images/icon/reset.png';

export default function ColorChipType2() {
  return (
    <>
      <ul className="colorChip type2">
        <li className="ongoing">진행중</li>
        <li className="stop">정지</li>
        <li className="completion">완료</li>
        <li className="available">사용가능</li>
      </ul>
      <Button className="btnReset">
        <span>RESET</span>
        <Image src={BtnReset} alt="초기화" width={16} height={16} />
      </Button>
    </>
  );
}
