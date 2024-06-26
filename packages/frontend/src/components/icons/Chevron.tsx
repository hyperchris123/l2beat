import React, { SVGAttributes } from 'react'

import { cn } from '../../utils/cn'
import { Icon } from './Icon'

export function ChevronRightIcon(props: SVGAttributes<SVGElement>) {
  const { className, ...rest } = props
  return <ChevronDownIcon className={cn('-rotate-90', className)} {...rest} />
}

export function ChevronLeftIcon(props: SVGAttributes<SVGElement>) {
  const { className, ...rest } = props
  return <ChevronDownIcon className={cn('rotate-90', className)} {...rest} />
}

export function ChevronUpIcon(props: SVGAttributes<SVGElement>) {
  const { className, ...rest } = props
  return <ChevronDownIcon className={cn('rotate-180', className)} {...rest} />
}

export function ChevronDownIcon(props: SVGAttributes<SVGElement>) {
  const { className, ...rest } = props
  return (
    <Icon
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-label="Chevron icon"
      className={cn('my-auto', className)}
      {...rest}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.484807 4.55147C0.953436 4.08284 1.71323 4.08284 2.18186 4.55147L8 10.3696L13.8181 4.55147C14.2868 4.08284 15.0466 4.08284 15.5152 4.55147C15.9838 5.0201 15.9838 5.7799 15.5152 6.24853L8.94281 12.8209C8.42212 13.3416 7.5779 13.3416 7.05719 12.8209L0.484807 6.24853C0.0161778 5.7799 0.0161778 5.0201 0.484807 4.55147Z"
      />
    </Icon>
  )
}
