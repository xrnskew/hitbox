import { pictureUrl } from '@/core/pictures.ts'

/** Рисунок из набора HitBox размером 1em — как смайлик, подстраивается под font-size родителя. */
export function Pic({ name, className }: { name: string; className?: string }) {
  return (
    <img
      className={className ? `pic ${className}` : 'pic'}
      src={pictureUrl(name)}
      alt=""
      draggable={false}
      data-pic={name}
    />
  )
}
