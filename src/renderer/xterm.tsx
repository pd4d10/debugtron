import { type FC, useEffect, useRef, useState } from "react";
import { CanvasAddon } from "@xterm/addon-canvas";
import { FitAddon } from "@xterm/addon-fit";
import { type ITerminalOptions, Terminal } from "@xterm/xterm";
import { SearchAddon } from "@xterm/addon-search";
import { InputGroup } from "@blueprintjs/core";
import "@xterm/xterm/css/xterm.css";
import "./xterm.css";

const searchDecorationOptions = {
  // 匹配项的背景颜色
  matchBackground: "#FFD700", // 金色，明亮且易于识别
  // 匹配项的边框颜色
  matchBorder: "#FF8C00", // 暗橙色，与背景形成对比
  // 匹配项在概览标尺中的颜色
  matchOverviewRuler: "#FFD700", // 与背景相同，使其在标尺中突出
  // 当前激活匹配项的背景颜色
  activeMatchBackground: "#FF4500", // 橙红色，清晰显示当前项
  // 当前激活匹配项的边框颜色
  activeMatchBorder: "#FF6347", // 西红柿色，进一步强调当前匹配
  // 当前激活匹配项在概览标尺中的颜色
  activeMatchColorOverviewRuler: "#FF4500" // 与激活背景相同，便于识别
};

export const Xterm: FC<{ content: string; options?: ITerminalOptions }> = ({
  content,
  options
}) => {
  const [visible, setVisible] = useState(false);
  const [countDisplay, setCountDisplay] = useState({ count: 0, cur: 0 });

  const domRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal>();
  const searchAddonRef = useRef<SearchAddon>();
  const searchVal = useRef("");

  const onFindNext = (val?: string) => {
    searchAddonRef.current?.findNext(val || searchVal.current, {
      incremental: true,
      decorations: searchDecorationOptions
    });
  };

  const onFindPrevious = (val?: string) => {
    searchAddonRef.current?.findPrevious(val || searchVal.current, {
      incremental: true,
      decorations: searchDecorationOptions
    });
  };

  const onSearch = (e) => {
    searchVal.current = e.target.value;
    onFindNext();
  };

  const onClose = () => {
    setVisible(false);
    searchAddonRef.current?.dispose();
  };

  useEffect(() => {
    const term = new Terminal({ ...options, allowProposedApi: true });
    searchAddonRef.current = new SearchAddon();
    term.loadAddon(new FitAddon());
    term.loadAddon(new CanvasAddon());
    term.loadAddon(searchAddonRef.current);
    term.open(domRef.current!);
    termRef.current = term;
    term.resize(200, 50);
    searchAddonRef.current?.onDidChangeResults(
      ({ resultIndex, resultCount }) => {
        if (resultCount > 0) {
          setCountDisplay({ count: resultCount, cur: resultIndex + 1 });
        } else {
          setCountDisplay({ count: 0, cur: 0 });
        }
      }
    );

    return () => {
      termRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", (event) => {
      if ((event?.metaKey || event.ctrlKey) && event.key === "f") {
        !visible && setVisible(true);
      }
    });
  }, []);

  useEffect(() => {
    termRef.current?.clear();
    termRef.current?.writeln(content);
  }, [content]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={domRef} style={{ height: "90vh" }} />
      <div
        className="xterm-search-panel"
        style={{ display: visible ? "flex" : "none" }}
      >
        <InputGroup placeholder="请输入搜索内容" onChange={onSearch} />
        <span>
          {countDisplay.cur}/{countDisplay.count}
        </span>
        <span
          className="xterm-search-panel-up"
          onClick={() => onFindPrevious()}
        >
          ↑
        </span>
        <span className="xterm-search-panel-down" onClick={() => onFindNext()}>
          ↓
        </span>
        <span className="xterm-search-panel-close" onClick={onClose}>
          ×
        </span>
      </div>
    </div>
  );
};
