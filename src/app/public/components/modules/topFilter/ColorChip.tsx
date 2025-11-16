'use client';

import { Button } from '@mui/material';
import Image from 'next/image';

import BtnReset from '@/assets/images/icon/reset.png';
import chip_01 from '@/assets/images/icon/chip_01.png';
import chip_02 from '@/assets/images/icon/chip_02.png';
import chip_03 from '@/assets/images/icon/chip_03.png';
import chip_04 from '@/assets/images/icon/chip_04.png';
import chip_06 from '@/assets/images/icon/chip_06.png';
import chip_07 from '@/assets/images/icon/chip_07.png';
import chip_08 from '@/assets/images/icon/chip_08.png';
import chip_09 from '@/assets/images/icon/chip_09.png';

export default function ColorChip() {
  return (
    <>
      {/* 점등/점멸 상태 */}
      <ul className="colorChip">
        <li>
          <Image src={chip_01} alt="" />
          점등
        </li>
        <li>
          <Image src={chip_02} alt="" />
          점멸
        </li>
      </ul>

      {/* 장비 상태 레전드 */}
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
          <Image src={chip_09} alt="" />
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

      {/* RESET 버튼 – 지금은 UI만, 필요하면 onClick 추가해서 필터 초기화 등 연결 */}
      <Button className="btnReset">
        <span>RESET</span>
        <Image src={BtnReset} alt="초기화" width={16} height={16} />
      </Button>
    </>
  );
}
