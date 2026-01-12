import Editor from "@monaco-editor/react";
import { useQueryStore } from "../../store/queryStore";
import { useTheme } from "../../hooks/useTheme";

export function SqlEditor() {
  const { query, setQuery } = useQueryStore();
  const { isDark } = useTheme();

  return (
    <Editor
      height="100%"
      defaultLanguage="sql"
      value={query}
      onChange={(value) => setQuery(value || "")}
      theme={isDark ? "vs-dark" : "light"}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 2,
        padding: { top: 8, bottom: 8 },
      }}
    />
  );
}
