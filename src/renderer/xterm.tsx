import { CanvasAddon } from "@xterm/addon-canvas";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal, type ITerminalOptions } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef, type FC } from "react";

export const Xterm: FC<{ content: string; options?: ITerminalOptions }> = ({
  content,
  options,
}) => {
  const domRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal>();

  useEffect(() => {
    const term = new Terminal(options);
    term.loadAddon(new FitAddon());
    term.loadAddon(new CanvasAddon());
    term.open(domRef.current!);
    termRef.current = term;

    return () => {
      termRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    termRef.current?.clear();
    termRef.current?.writeln(content);
  }, [content]);

  return <div ref={domRef} />;
};
