"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function ChatPage() {
  const [threads, setThreads] = useState(() => [
    {
      id: "t1",
      title: "PHIL-100: Free will notes",
      updatedAt: Date.now(),
      messages: [{ role: "assistant", content: "Paste your notes and ask anything.", at: Date.now() }],
    },
  ]);

  const [activeId, setActiveId] = useState("t1");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  // “+” menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [attached, setAttached] = useState([]); // UI-only list
  const fileInputRef = useRef(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId),
    [threads, activeId]
  );

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => t.title.toLowerCase().includes(q));
  }, [threads, search]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, activeThread?.messages?.length]);

  // Close menu on outside click
  useEffect(() => {
    function onDocClick(e) {
      const el = e.target;
      if (el?.closest?.("[data-plus-menu]")) return;
      setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function newThread() {
    const id = crypto.randomUUID();
    const t = {
      id,
      title: "New chat",
      updatedAt: Date.now(),
      messages: [{ role: "assistant", content: "What are you studying today?", at: Date.now() }],
    };
    setThreads((prev) => [t, ...prev]);
    setActiveId(id);
  }

  function renameThread(id) {
    const name = prompt("Rename chat title:");
    if (!name?.trim()) return;
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: name.trim(), updatedAt: Date.now() } : t))
    );
  }

  function deleteThread(id) {
    if (!confirm("Delete this chat?")) return;
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) {
      const remaining = threads.filter((t) => t.id !== id);
      setActiveId(remaining[0]?.id || "");
    }
  }

  function onPickFiles(e) {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;

    // limit to 4 total
    setAttached((prev) => {
      const next = [...prev, ...list].slice(0, 4);
      return next;
    });

    e.target.value = "";
    setMenuOpen(false);
  }

  function removeAttached(index) {
    setAttached((prev) => prev.filter((_, i) => i !== index));
  }

  function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeThread) return;

    setInput("");

    const attachmentSummary =
      attached.length > 0
        ? `\n\n📎 Attached (${attached.length}/4): ${attached.map((f) => f.name).join(", ")}`
        : "";

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeId) return t;
        const nextMsgs = [
          ...t.messages,
          {
            role: "user",
            content: agentMode ? `[Agent Mode ON]\n${text}${attachmentSummary}` : `${text}${attachmentSummary}`,
            at: Date.now(),
          },
          {
            role: "assistant",
            content: "UI saved. Next sprint we’ll connect AI + file reading + agents.",
            at: Date.now(),
          },
        ];
        return { ...t, messages: nextMsgs, updatedAt: Date.now() };
      })
    );

    // clear attachments after send
    setAttached([]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      {/* Left: history */}
      <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-extrabold text-slate-900">Chat History</h1>
            <button
              onClick={newThread}
              className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              New
            </button>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="mt-3 w-full rounded-xl text-blue-700 border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="max-h-[60vh] overflow-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-slate-600">No chats found.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredThreads.map((t) => {
                const active = t.id === activeId;
                return (
                  <li key={t.id} className="p-3">
                    <div
                      role = "button"
                      tabIndex = {0}
                      onClick={() => setActiveId(t.id)}
                      onKeyDown = {(e) => {
                        if ( e.key === "Enter" || e.key === " ") setActiveId( t.id );
                      }}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        active ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-bold text-slate-900 truncate">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Updated: {new Date(t.updatedAt).toLocaleString()}
                      </p>

                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            renameThread(t.id);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Rename
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteThread(t.id);
                          }}
                          className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Right: chat */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-extrabold text-slate-900">{activeThread?.title || "Chat"}</h2>
          <p className="text-sm text-slate-600 mt-1">Ask questions about your notes.</p>
        </div>

        <div className="max-h-[60vh] overflow-auto p-4 space-y-3">
          {(activeThread?.messages || []).map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm border leading-relaxed ${
                    isUser
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-900 border-slate-200"
                  }`}
                  style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}
                >
                  <p className="whitespace-pre-wrap font-medium">{m.content}</p>
                  <p className={`mt-2 text-[11px] ${isUser ? "text-white/80" : "text-slate-500"}`}>
                    {new Date(m.at || Date.now()).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form onSubmit={sendMessage} className="border-t border-slate-100 p-4">
          {/* Attachments chips */}
          {attached.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attached.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                >
                  <span className="truncate max-w-[220px]">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttached(i)}
                    className="rounded-full px-2 py-0.5 text-slate-600 hover:bg-slate-200"
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-stretch">
            {/* + menu */}
            <div className="relative" data-plus-menu>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className="h-full rounded-xl border border-slate-200 bg-white px-4 text-slate-800 font-extrabold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                aria-label="Open menu"
              >
                +
              </button>

              {menuOpen && (
                <div className="absolute bottom-[52px] left-0 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div className="font-semibold text-slate-900">📎 Add photos & files</div>
                    <div className="text-xs text-slate-500">Max 4 files</div>
                  </button>

                  <div className="border-t border-slate-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">🧠 Agent mode</div>
                        <div className="text-xs text-slate-500">UI only (for now)</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAgentMode((v) => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          agentMode ? "bg-indigo-600" : "bg-slate-300"
                        }`}
                        aria-label="Toggle agent mode"
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                            agentMode ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                // “any format” is risky UX-wise; this accepts most typical docs + images.
                // You can expand later.
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv,.json,.png,.jpg,.jpeg"
                onChange={onPickFiles}
              />
            </div>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={agentMode ? "Ask in agent mode…" : "Type your question…"}
              className="flex-1 rounded-xl text-blue-700 border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
