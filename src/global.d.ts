declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const DEBUGTRON_GITHUB_TOKEN: string
declare module 'electron-redux'

declare module 'regedit' {
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
}

interface Array<T> {
  filter<U extends T>(pred: (a: T) => a is U): U[]
}
