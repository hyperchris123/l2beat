import React from 'react'

import { formatNumberWithCommas } from '../../../utils'

interface TableSumProps {
  amount: number
}

export function TableSum(props: TableSumProps) {
  return (
    <div className="mt-3 flex self-end pr-0 font-medium text-base md:pr-4">
      <span className="text-gray-500 dark:text-gray-50">Total:&nbsp;</span>
      <span className="text-pink-800 dark:text-pink-200">
        ${formatNumberWithCommas(props.amount)}
      </span>
    </div>
  )
}
