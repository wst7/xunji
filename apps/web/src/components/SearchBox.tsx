import { useState } from 'react'
import { SearchIcon } from './Icons'

export function SearchBox({
  onSubmit,
  loading = false,
}: {
  onSubmit: (query: string) => void
  loading?: boolean
}) {
  const [value, setValue] = useState('')
  const query = value.trim()

  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        if (query) onSubmit(query)
      }}
    >
      <SearchIcon size={19} />
      <input
        className="search-input"
        type="text"
        placeholder="想找回什么？"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="搜索你收藏过的内容"
      />
      <button className="search-submit" type="submit" disabled={loading}>
        {loading ? '查找中…' : '找回'}
      </button>
    </form>
  )
}
