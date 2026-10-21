import React, { useState, useMemo, useEffect, useRef } from "react";
import "./jsonView.css";

// ── Sample Complex JSON ────────────────────────────────────────────────────────
const DEFAULT_SAMPLE_JSON = {
  project: "AI Knowledge Architecture",
  version: "2.4.0",
  active: true,
  metadata: {
    author: "Zeff Ali",
    organization: "Antigravity Systems",
    created_at: new Date().toISOString(),
    tags: ["llm", "pipeline", "agentic", "vector-db"],
  },
  ai_context_definition: {
    service: "Modular Kitchen Interior",
    attribute: "Finishes & Materials",
    parameters: {
      budget_tier: "Premium",
      estimated_days: 28,
      is_customizable: true,
      pricing: {
        base_unit: "running_ft",
        min_cost: 150000,
        max_cost: 650000,
        currency: "INR",
      },
    },
    attached_media: [
      {
        id: 101,
        type: "image",
        title: "Modern Acrylic Matte Finish",
        url: "https://example.com/images/acrylic-finish.jpg",
        tags: ["matte", "kitchen", "acrylic"],
      },
      {
        id: 102,
        type: "pdf",
        title: "Kitchen Catalog & Specs 2026",
        file_size_kb: 4210,
        url: "https://example.com/docs/catalog-2026.pdf",
      },
      {
        id: 103,
        type: "youtube",
        title: "Factory Tour & Material Testing",
        video_id: "dQw4w9WgXcQ",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
  execution_steps: [
    { step: 1, name: "Data Ingestion", status: "completed", latency_ms: 120 },
    { step: 2, name: "Vector Embedding", status: "completed", latency_ms: 450 },
    { step: 3, name: "Prompt Construction", status: "pending", latency_ms: null },
  ],
  security_policies: {
    require_auth: false,
    rate_limiting: {
      enabled: true,
      rpm: 120,
    },
  },
};

export type ContentType = "json" | "text";

interface SavedJsonItem {
  id: string;
  folder: string;
  title: string;
  content: string;
  type?: ContentType;
  timestamp: string;
  size: string;
}

const LOCAL_STORAGE_KEY = "json_workbench_saved_snippets";
const LOCAL_STORAGE_FOLDERS_KEY = "json_workbench_saved_folders";

const DEFAULT_FOLDERS = ["General", "Schemas", "AI Payloads", "Contexts", "Notes"];

// ── Helper to update nested value by path ────────────────────────────────────
function updateNestedValue(obj: any, path: (string | number)[], newValue: any): any {
  if (path.length === 0) return newValue;

  const [head, ...tail] = path;
  const isArr = Array.isArray(obj);
  const copy = isArr ? [...obj] : { ...obj };

  if (tail.length === 0) {
    copy[head] = newValue;
  } else {
    copy[head] = updateNestedValue(copy[head], tail, newValue);
  }
  return copy;
}

// ── Interactive Tree Node Component ──────────────────────────────────────────
interface TreeNodeProps {
  name?: string | number;
  value: any;
  depth?: number;
  isLast?: boolean;
  filterText: string;
  path: (string | number)[];
  onValueChange: (path: (string | number)[], newVal: any) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  name,
  value,
  depth = 0,
  isLast = true,
  filterText,
  path,
  onValueChange,
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(depth > 2);

  const isObject = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);

  // Cast input string into real JSON primitive type
  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    const rawText = e.currentTarget.innerText.trim();
    let parsedVal: any = rawText;

    if (rawText === "true") parsedVal = true;
    else if (rawText === "false") parsedVal = false;
    else if (rawText === "null") parsedVal = null;
    else if (!isNaN(Number(rawText)) && rawText !== "") {
      parsedVal = Number(rawText);
    } else {
      // String value: remove surrounding quotes if user entered them
      if (rawText.startsWith('"') && rawText.endsWith('"') && rawText.length >= 2) {
        parsedVal = rawText.slice(1, -1);
      } else {
        parsedVal = rawText;
      }
    }

    if (parsedVal !== value) {
      onValueChange(path, parsedVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  // Render Primitive values
  if (!isObject) {
    let typeClass = "jw-val-string";
    if (value === null) typeClass = "jw-val-null";
    else if (typeof value === "number") typeClass = "jw-val-number";
    else if (typeof value === "boolean") typeClass = "jw-val-boolean";

    const displayVal = value === null ? "null" : String(value);

    return (
      <div className="jw-line">
        <span className="jw-toggle-space" />
        {name !== undefined && (
          <>
            <span className="jw-key">{typeof name === "number" ? name : `"${name}"`}</span>
            <span className="jw-colon">:</span>
          </>
        )}
        {typeof value === "string" && <span style={{ color: "#34d399" }}>"</span>}
        <span
          contentEditable
          suppressContentEditableWarning
          className={`jw-editable ${typeClass}`}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          title="Click to edit value inline"
        >
          {displayVal}
        </span>
        {typeof value === "string" && <span style={{ color: "#34d399" }}>"</span>}
        {!isLast && <span style={{ color: "#64748b" }}>,</span>}
      </div>
    );
  }

  // Object / Array handling
  const keys = Object.keys(value);
  const itemsCount = keys.length;
  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";

  return (
    <div className="jw-tree-node">
      <div className="jw-line">
        <button
          type="button"
          className="jw-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▶" : "▼"}
        </button>

        {name !== undefined && (
          <>
            <span className="jw-key">{typeof name === "number" ? name : `"${name}"`}</span>
            <span className="jw-colon">:</span>
          </>
        )}

        <span className="jw-bracket">{openBracket}</span>

        {collapsed ? (
          <span
            className="jw-collapsed-badge"
            onClick={() => setCollapsed(false)}
          >
            {itemsCount} {itemsCount === 1 ? "item" : "items"}
          </span>
        ) : null}

        {collapsed && <span className="jw-bracket">{closeBracket}</span>}
        {collapsed && !isLast && <span style={{ color: "#64748b" }}>,</span>}
      </div>

      {!collapsed && itemsCount > 0 && (
        <div className="jw-children">
          {keys.map((key, index) => {
            const childVal = value[key];
            const childIsLast = index === itemsCount - 1;
            const childName = isArray ? Number(key) : key;
            const childPath = [...path, childName];

            return (
              <TreeNode
                key={key}
                name={childName}
                value={childVal}
                depth={depth + 1}
                isLast={childIsLast}
                filterText={filterText}
                path={childPath}
                onValueChange={onValueChange}
              />
            );
          })}
        </div>
      )}

      {!collapsed && (
        <div className="jw-line">
          <span className="jw-toggle-space" />
          <span className="jw-bracket">{closeBracket}</span>
          {!isLast && <span style={{ color: "#64748b" }}>,</span>}
        </div>
      )}
    </div>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────
export const JsonView: React.FC = () => {
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(DEFAULT_SAMPLE_JSON, null, 2)
  );
  const [contentType, setContentType] = useState<ContentType>("json");
  const [viewMode, setViewMode] = useState<"tree" | "raw">("tree");
  const [filterText, setFilterText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Horizontal Drag Resize state
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    const saved = localStorage.getItem("jw_split_width");
    return saved ? parseFloat(saved) : 30;
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  // Folders and Saved Items state
  const [folders, setFolders] = useState<string[]>(() => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_FOLDERS_KEY);
      return data ? JSON.parse(data) : DEFAULT_FOLDERS;
    } catch {
      return DEFAULT_FOLDERS;
    }
  });

  const [savedList, setSavedList] = useState<SavedJsonItem[]>(() => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveTitle, setSaveTitle] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string>("General");
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState<boolean>(false);
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null);

  const [showSavedDropdown, setShowSavedDropdown] = useState<boolean>(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Helper to re-read directly from localStorage
  const syncFromLocalStorage = () => {
    try {
      const itemsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (itemsRaw) {
        setSavedList(JSON.parse(itemsRaw));
      }
      const foldersRaw = localStorage.getItem(LOCAL_STORAGE_FOLDERS_KEY);
      if (foldersRaw) {
        setFolders(JSON.parse(foldersRaw));
      }
    } catch (e) {
      console.error("Failed to parse local storage", e);
    }
  };

  // 1. Cross-tab real-time listener (fires when other tab updates localStorage)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          setSavedList(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === LOCAL_STORAGE_FOLDERS_KEY && e.newValue) {
        try {
          setFolders(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 2. Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSavedDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dragging logic for horizontal resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const rawPct = ((e.clientX - rect.left) / rect.width) * 100;
      const newWidth = Math.min(Math.max(rawPct, 15), 85);
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        localStorage.setItem("jw_split_width", String(leftWidth));
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    } else {
      document.body.style.cursor = "";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [isDragging, leftWidth]);

  // Parsing & validation
  const { parsedJson, error, stats } = useMemo(() => {
    if (!jsonText.trim()) {
      return { parsedJson: null, error: null, stats: null };
    }

    const sizeBytes = new Blob([jsonText]).size;
    const sizeStr = (sizeBytes / 1024).toFixed(1) + " KB";

    if (contentType === "text") {
      const words = jsonText.trim().split(/\s+/).filter(Boolean).length;
      const lines = jsonText.split("\n").length;
      return {
        parsedJson: null,
        error: null,
        stats: {
          size: sizeStr,
          items: `${words} words, ${lines} lines`,
        },
      };
    }

    try {
      const parsed = JSON.parse(jsonText);
      const count = Array.isArray(parsed)
        ? parsed.length
        : typeof parsed === "object" && parsed !== null
        ? Object.keys(parsed).length
        : 1;

      return {
        parsedJson: parsed,
        error: null,
        stats: {
          size: sizeStr,
          items: `${count} roots`,
        },
      };
    } catch (e: any) {
      return {
        parsedJson: null,
        error: e.message || "Invalid JSON syntax",
        stats: null,
      };
    }
  }, [jsonText, contentType]);

  // Actions
  const handleFormat = () => {
    if (!parsedJson || contentType !== "json") return;
    setJsonText(JSON.stringify(parsedJson, null, 2));
  };

  const handleMinify = () => {
    if (!parsedJson || contentType !== "json") return;
    setJsonText(JSON.stringify(parsedJson));
  };

  const handleClear = () => {
    setJsonText("");
  };

  const handleLoadSample = () => {
    if (contentType === "json") {
      setJsonText(JSON.stringify(DEFAULT_SAMPLE_JSON, null, 2));
    } else {
      setJsonText(
        `# Knowledge Document / AI Instruction\n\nThis is a sample plain text or markdown documentation.\nYou can write multi-line instructions, prompt engineering rules, or raw context notes here.\n\nKey Rules:\n1. Maintain exact parameter boundaries.\n2. Do not hallucinate prices.\n3. Verify all category dependencies.`
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Live Sync value change from Tree View to Input Editor
  const handleValueChange = (path: (string | number)[], newValue: any) => {
    if (!parsedJson) return;
    const updated = updateNestedValue(parsedJson, path, newValue);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  // Save current JSON/Text with title & folder (or update existing file)
  const handleSaveJson = () => {
    if (!saveTitle.trim() || !jsonText.trim()) return;

    let targetFolder = selectedFolder;
    if (isCreatingNewFolder && newFolderName.trim()) {
      targetFolder = newFolderName.trim();
      if (!folders.includes(targetFolder)) {
        const updatedFolders = [...folders, targetFolder];
        setFolders(updatedFolders);
        localStorage.setItem(LOCAL_STORAGE_FOLDERS_KEY, JSON.stringify(updatedFolders));
      }
    }

    const timestamp =
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      " " +
      new Date().toLocaleDateString();

    let updated: SavedJsonItem[];

    if (selectedExistingId) {
      // Overwrite/update existing file
      updated = savedList.map((item) =>
        item.id === selectedExistingId
          ? {
              ...item,
              folder: targetFolder,
              title: saveTitle.trim(),
              content: jsonText,
              type: contentType,
              timestamp,
              size: stats?.size || "0 KB",
            }
          : item
      );
    } else {
      // Create new file
      const newItem: SavedJsonItem = {
        id: String(Date.now()),
        folder: targetFolder,
        title: saveTitle.trim(),
        content: jsonText,
        type: contentType,
        timestamp,
        size: stats?.size || "0 KB",
      };
      updated = [newItem, ...savedList];
    }

    setSavedList(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    setShowSaveModal(false);
    setSaveTitle("");
    setNewFolderName("");
    setIsCreatingNewFolder(false);
    setSelectedExistingId(null);
  };

  const handleLoadSavedItem = (item: SavedJsonItem) => {
    setJsonText(item.content);
    if (item.type) {
      setContentType(item.type);
    } else {
      // Auto-detect if JSON
      try {
        JSON.parse(item.content);
        setContentType("json");
      } catch {
        setContentType("text");
      }
    }
    setShowSavedDropdown(false);
  };

  const handleDeleteSavedItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved item?")) return;
    const updated = savedList.filter((item) => item.id !== id);
    setSavedList(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const folderItemsCount = savedList.filter((i) => i.folder === folderName).length;
    if (
      !window.confirm(
        `Delete folder '${folderName}'${
          folderItemsCount > 0
            ? ` and all its ${folderItemsCount} saved items?`
            : "?"
        }`
      )
    )
      return;

    const updatedItems = savedList.filter((i) => i.folder !== folderName);
    const updatedFolders = folders.filter((f) => f !== folderName);

    setSavedList(updatedItems);
    setFolders(updatedFolders);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedItems));
    localStorage.setItem(LOCAL_STORAGE_FOLDERS_KEY, JSON.stringify(updatedFolders));
  };

  const toggleFolderCollapse = (folderName: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  // Group items by folder
  const groupedItems = useMemo(() => {
    const map: Record<string, SavedJsonItem[]> = {};

    // Initialize all existing folders
    folders.forEach((f) => {
      map[f] = [];
    });

    // Populate items
    savedList.forEach((item) => {
      const f = item.folder || "General";
      if (!map[f]) map[f] = [];
      map[f].push(item);
    });

    return map;
  }, [folders, savedList]);

  return (
    <div className="jw-container">
      {/* ── Top Header Bar ── */}
      <header className="jw-header">
        <div className="jw-header-left">
          <span className="jw-logo-badge">STUDIO</span>
          <h1 className="jw-header-title">
            {contentType === "json" ? "JSON Workbench" : "Text & Notes Studio"}
          </h1>

          {/* Mode Switcher: JSON / Text */}
          <div className="jw-mode-toggle" title="Switch between JSON and Text/Notes">
            <button
              type="button"
              className={`jw-mode-btn ${contentType === "json" ? "jw-mode-btn--active" : ""}`}
              onClick={() => setContentType("json")}
            >
              {`{ }`} JSON
            </button>
            <button
              type="button"
              className={`jw-mode-btn ${contentType === "text" ? "jw-mode-btn--active" : ""}`}
              onClick={() => setContentType("text")}
            >
              📝 Text
            </button>
          </div>
        </div>

        <div className="jw-header-right">
          {/* View Saved Folders Dropdown */}
          <div className="jw-dropdown-wrap" ref={dropdownRef}>
            <button
              className="jw-btn"
              onClick={() => {
                if (!showSavedDropdown) {
                  syncFromLocalStorage();
                }
                setShowSavedDropdown(!showSavedDropdown);
              }}
            >
              📁 View Saved ({savedList.length}) ▼
            </button>

            {showSavedDropdown && (
              <div className="jw-dropdown-menu">
                <div className="jw-dropdown-header">
                  <span>Saved Folders & Snippets ({savedList.length})</span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Local Storage
                  </span>
                </div>

                <div className="jw-dropdown-list">
                  {Object.keys(groupedItems).length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        fontSize: "12px",
                        color: "#64748b",
                        textAlign: "center",
                      }}
                    >
                      No saved items yet.
                    </div>
                  ) : (
                    Object.entries(groupedItems).map(([folderName, items]) => {
                      const isCollapsed = collapsedFolders[folderName];

                      return (
                        <div key={folderName} className="jw-folder-group">
                          <div
                            className="jw-folder-header"
                            onClick={() => toggleFolderCollapse(folderName)}
                          >
                            <div className="jw-folder-header-left">
                              <span>{isCollapsed ? "📁" : "📂"}</span>
                              <span title={folderName}>{folderName}</span>
                              <span className="jw-folder-count">
                                {items.length}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="jw-saved-delete-btn"
                              title={`Delete folder '${folderName}'`}
                              onClick={(e) => handleDeleteFolder(folderName, e)}
                            >
                              🗑️
                            </button>
                          </div>

                          {!isCollapsed && (
                            <div className="jw-folder-items">
                              {items.length === 0 ? (
                                <div
                                  style={{
                                    padding: "8px 24px",
                                    fontSize: "11px",
                                    color: "#64748b",
                                    fontStyle: "italic",
                                  }}
                                >
                                  Empty folder
                                </div>
                              ) : (
                                items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="jw-dropdown-item"
                                    onClick={() => handleLoadSavedItem(item)}
                                  >
                                    <div className="jw-saved-info">
                                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span
                                          className={`jw-type-badge jw-type-badge--${item.type || "json"}`}
                                        >
                                          {item.type === "text" ? "TXT" : "JSON"}
                                        </span>
                                        <span
                                          className="jw-saved-title"
                                          title={item.title}
                                        >
                                          {item.title}
                                        </span>
                                      </div>
                                      <span className="jw-saved-meta">
                                        {item.timestamp} • {item.size}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      className="jw-saved-delete-btn"
                                      title="Delete item"
                                      onClick={(e) =>
                                        handleDeleteSavedItem(item.id, e)
                                      }
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            className="jw-btn jw-btn-success"
            onClick={() => {
              syncFromLocalStorage();
              setSelectedExistingId(null);
              setSaveTitle("");
              setIsCreatingNewFolder(false);
              setNewFolderName("");
              setShowSaveModal(true);
            }}
            disabled={!jsonText.trim()}
          >
            💾 {contentType === "json" ? "Save JSON" : "Save Text"}
          </button>

          <button className="jw-btn" onClick={handleLoadSample}>
            ⚡ {contentType === "json" ? "Sample JSON" : "Sample Text"}
          </button>
          {contentType === "json" && (
            <>
              <button
                className="jw-btn"
                onClick={handleFormat}
                disabled={!parsedJson}
              >
                🪄 Beautify
              </button>
              <button
                className="jw-btn"
                onClick={handleMinify}
                disabled={!parsedJson}
              >
                📦 Minify
              </button>
            </>
          )}
          <button
            className="jw-btn"
            onClick={handleCopy}
            disabled={!jsonText.trim()}
          >
            {copied ? "✅ Copied" : "📋 Copy"}
          </button>
          <button className="jw-btn jw-btn-danger" onClick={handleClear}>
            ✕ Clear
          </button>
        </div>
      </header>

      {/* ── Workspace: Left (stretchable) | Splitter | Right (70%) ── */}
      <div className="jw-workspace" ref={workspaceRef}>
        {/* ── LEFT PANE: JSON/TEXT INPUT ── */}
        <section className="jw-left-pane" style={{ width: `${leftWidth}%` }}>
          <div className="jw-panel-bar">
            <span className="jw-panel-title">
              📝 {contentType === "json" ? "JSON Editor" : "Text Editor"} ({Math.round(leftWidth)}%)
            </span>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              {contentType === "json" ? "Paste Raw JSON" : "Plain Text / Markdown"}
            </span>
          </div>

          <div className="jw-editor-wrapper">
            <textarea
              className="jw-textarea"
              placeholder={
                contentType === "json"
                  ? "Paste or type complex JSON here..."
                  : "Type or paste plain text, documentation, markdown notes, prompts..."
              }
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="jw-status-bar">
            {contentType === "text" ? (
              <span className="jw-status-success">
                ✓ Text Mode ({stats?.items}, {stats?.size})
              </span>
            ) : error ? (
              <span className="jw-status-error" title={error}>
                ⚠️ {error}
              </span>
            ) : parsedJson ? (
              <span className="jw-status-success">
                ✓ Valid JSON ({stats?.items}, {stats?.size})
              </span>
            ) : (
              <span>Empty</span>
            )}
            <span>UTF-8</span>
          </div>
        </section>

        {/* ── HORIZONTAL RESIZE DIVIDER ── */}
        <div
          className={`jw-resizer ${isDragging ? "jw-resizer--dragging" : ""}`}
          onMouseDown={() => setIsDragging(true)}
          title="Drag horizontally to resize panes"
        >
          <div className="jw-resizer-line" />
        </div>

        {/* ── RIGHT PANE: LIVE STRUCTURED VIEWER / TEXT PREVIEW ── */}
        <section
          className="jw-right-pane"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="jw-panel-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="jw-panel-title">
                {contentType === "json"
                  ? `🌳 Structured View (${Math.round(100 - leftWidth)}%)`
                  : `📄 Text Document Preview (${Math.round(100 - leftWidth)}%)`}
              </span>
              {contentType === "json" && (
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    className={`jw-btn ${
                      viewMode === "tree" ? "jw-btn-active" : ""
                    }`}
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                    onClick={() => setViewMode("tree")}
                  >
                    Interactive Tree
                  </button>
                  <button
                    className={`jw-btn ${
                      viewMode === "raw" ? "jw-btn-active" : ""
                    }`}
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                    onClick={() => setViewMode("raw")}
                  >
                    Formatted Code
                  </button>
                </div>
              )}
            </div>

            {contentType === "json" && (
              <div className="jw-panel-actions">
                <input
                  type="text"
                  className="jw-search-input"
                  placeholder="Search keys..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="jw-viewer-container">
            {contentType === "text" ? (
              !jsonText.trim() ? (
                <div className="jw-empty-state">
                  <span className="jw-empty-icon">📝</span>
                  <span className="jw-empty-text">No text content</span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Type or paste text notes on the left pane or click "Sample Text".
                  </span>
                </div>
              ) : (
                <div className="jw-text-preview">{jsonText}</div>
              )
            ) : error ? (
              <div className="jw-empty-state">
                <span className="jw-empty-icon">⚠️</span>
                <span className="jw-empty-text" style={{ color: "#f87171" }}>
                  JSON Syntax Error: {error}
                </span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Please check commas, braces, or quotes on the left pane.
                </span>
              </div>
            ) : !parsedJson ? (
              <div className="jw-empty-state">
                <span className="jw-empty-icon">📄</span>
                <span className="jw-empty-text">No JSON data to display</span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Enter JSON on the left pane or click "Sample JSON".
                </span>
              </div>
            ) : viewMode === "tree" ? (
              <div className="jw-tree-scroll">
                <TreeNode
                  value={parsedJson}
                  filterText={filterText}
                  path={[]}
                  onValueChange={handleValueChange}
                />
              </div>
            ) : (
              <pre className="jw-raw-view">
                {JSON.stringify(parsedJson, null, 2)}
              </pre>
            )}
          </div>
        </section>
      </div>

      {/* ── Save with Title & Folder Modal ── */}
      {showSaveModal && (
        <div
          className="jw-modal-overlay"
          onClick={() => setShowSaveModal(false)}
        >
          <div className="jw-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="jw-modal-title">
              💾 Save {contentType === "json" ? "JSON Snippet" : "Text Document"}
            </h3>

            {/* Folder Selection */}
            <div className="jw-form-group">
              <label className="jw-form-label">Select Folder</label>
              {!isCreatingNewFolder ? (
                <>
                  <div className="jw-folder-tags">
                    {folders.map((f) => (
                      <button
                        key={f}
                        type="button"
                        className={`jw-folder-tag ${
                          selectedFolder === f ? "jw-folder-tag--active" : ""
                        }`}
                        onClick={() => setSelectedFolder(f)}
                      >
                        📁 {f}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="jw-folder-tag"
                      style={{ borderStyle: "dashed", color: "#818cf8" }}
                      onClick={() => setIsCreatingNewFolder(true)}
                    >
                      + New Folder
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="text"
                    autoFocus
                    className="jw-modal-input"
                    placeholder="New folder name..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <button
                    type="button"
                    className="jw-btn"
                    onClick={() => setIsCreatingNewFolder(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Existing File Selection or New File */}
            <div className="jw-form-group">
              <label className="jw-form-label">Save As</label>
              <div className="jw-folder-tags">
                <button
                  type="button"
                  className={`jw-folder-tag ${
                    selectedExistingId === null ? "jw-folder-tag--active" : ""
                  }`}
                  onClick={() => {
                    setSelectedExistingId(null);
                    setSaveTitle("");
                  }}
                  style={{ borderStyle: "dashed" }}
                >
                  ✨ + Create New Snippet
                </button>

                {savedList
                  .filter((item) => item.folder === selectedFolder)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`jw-folder-tag ${
                        selectedExistingId === item.id ? "jw-folder-tag--active" : ""
                      }`}
                      onClick={() => {
                        setSelectedExistingId(item.id);
                        setSaveTitle(item.title);
                      }}
                      title={`Overwrite "${item.title}"`}
                    >
                      📄 {item.title}
                    </button>
                  ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="jw-form-group">
              <label className="jw-form-label">
                {selectedExistingId ? "Snippet Title (Will Overwrite Selected)" : "New Snippet Title"}
              </label>
              <input
                type="text"
                autoFocus={!isCreatingNewFolder}
                className="jw-modal-input"
                placeholder="e.g. Lead Qualification Schema or Media Payload"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveJson();
                }}
              />
            </div>

            <div className="jw-modal-actions">
              <button
                className="jw-btn"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
              <button
                className="jw-btn jw-btn-primary"
                onClick={handleSaveJson}
                disabled={
                  !saveTitle.trim() ||
                  (isCreatingNewFolder && !newFolderName.trim())
                }
              >
                Save Snippet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
