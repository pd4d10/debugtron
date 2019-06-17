import React, { FC, useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'

export const Term: FC<{ message: string }> = ({ message }) => {
  const [term] = useState(() => new Terminal())
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (ref.current) {
      term.open(ref.current)
      term.write(message)
      return () => {
        term.destroy()
      }
    }
  }, [ref.current])

  useEffect(() => {
    term.clear()
    term.write(message)
  }, [message])

  return <div ref={ref} />
}
