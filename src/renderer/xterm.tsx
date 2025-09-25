import { CanvasAddon } from "@xterm/addon-canvas";
import { FitAddon } from "@xterm/addon-fit";
import { type ITerminalOptions, Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import React, { type FC, useEffect, useRef } from "react";

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
    if (domRef.current) term.open(domRef.current);
    termRef.current = term;

    return () => {
      termRef.current?.dispose();
    };
  }, [options]);

  useEffect(() => {
    termRef.current?.clear();
    termRef.current?.writeln(content);
  }, [content]);

  return <div ref={domRef} />;
};
