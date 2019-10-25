interface Result {
  keys?: string[]
  values?: {
    [key: string]: any
  }
}

export function list(
  paths: string | string[],
  arch: string,
  callback: (
    err: Error,
    data: {
      [key: string]: Result
    },
  ) => void,
): void
