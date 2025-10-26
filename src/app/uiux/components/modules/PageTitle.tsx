'use client';
import Image, { StaticImageData } from 'next/image';

interface TitleProps {
  title: string;
  icon: StaticImageData;
}

export default function PageTitle({ title, icon }: TitleProps) {
  return (
    <h2 className="compTit">
      <Image src={icon} alt="" />
      <span>{title}</span>
    </h2>
  );
}
