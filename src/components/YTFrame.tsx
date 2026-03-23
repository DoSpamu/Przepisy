import { useState, useEffect } from 'react'

interface Props {
  src: string
  fallback?: string
  style?: React.CSSProperties
  onError?: () => void
}

export function YTFrame({ src, fallback, style, onError }: Props) {
  const [cur, setCur] = useState(src)
  useEffect(() => setCur(src), [src])
  return (
    <img
      src={cur}
      style={style}
      alt=""
      onError={() => {
        if (cur === src && fallback) setCur(fallback)
        else onError?.()
      }}
    />
  )
}
