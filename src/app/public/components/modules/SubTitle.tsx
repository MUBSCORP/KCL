'use client';

interface TitleProps {
  title: string;
}

export default function SubTitle({ title }: TitleProps) {
  return (
    <h2 className="subTitle">
      <span>{title}</span>
    </h2>
  );
}
