'use client';

import { Button } from '@mui/material';
import Image from 'next/image';

import BtnReset from '@/assets/images/icon/reset.png';
// 퍼블 아이콘 재사용
import chip_03 from '@/assets/images/icon/chip_03.png'; // 진행중
import chip_05 from '@/assets/images/icon/chip_05.png'; // 정지/일시정지 계열
import chip_07 from '@/assets/images/icon/chip_07.png'; // 완료
import chip_08 from '@/assets/images/icon/chip_08.png'; // 대기/사용가능 계열

export default function ColorChipType2() {
  return (
    <>
      {/* type2: PACK 위치도 레전드용 */}
      <ul className="colorChip type2">
        <li className="ongoing">
          <Image src={chip_03} alt="" />
          진행중
        </li>
        <li className="stop">
          <Image src={chip_05} alt="" />
          정지
        </li>
        <li className="completion">
          <Image src={chip_07} alt="" />
          완료
        </li>
        <li className="available">
          <Image src={chip_08} alt="" />
          사용가능
        </li>
      </ul>

      <Button className="btnReset">
        <span>RESET</span>
        <Image src={BtnReset} alt="초기화" width={16} height={16} />
      </Button>
    </>
  );
}
