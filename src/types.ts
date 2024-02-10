export type Dict<T> = { [key: string]: T };

export interface MacosAppInfo {
  CFBundleIdentifier: string;
  CFBundleName: string;
  CFBundleExecutable: string;
  CFBundleIconFile: string;
}
