import { useEffect, useState } from 'react'

import { subscribeChange } from './bus'

/** 本地数据变化时自增的版本号，用作列表/详情重新加载的依赖。 */
export function useLocalRevision(): number {
  const [revision, setRevision] = useState(0)
  useEffect(() => subscribeChange(() => setRevision((value) => value + 1)), [])
  return revision
}
