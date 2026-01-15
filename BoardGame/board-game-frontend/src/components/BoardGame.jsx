// src/components/BoardGame.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Board from "./Board";
import QuestionCard from "./QuestionCard";
import QuestionTextCard from "./QuestionTextCard";

const API_BASE = "http://localhost:8080";
const POLL_MS = 1200; // base poll interval

// helper: max 8 chars (safe)
const formatName8 = (name, fallback = "Player") => {
  const v = (name ?? "").toString().trim();
  const out = v.length > 0 ? v : fallback;
  return out.slice(0, 8);
};

// safe read text -> json (or raw text)
const safeJson = async (res) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
};

// small helper for user-facing messages
const msgFromStatus = (status) => {
  switch (status) {
    case 400:
      return "Request invalid (400).";
    case 401:
      return "Please sign in again (401).";
    case 403:
      return "You are not allowed in this room (403).";
    case 404:
      return "Room not found (404).";
    case 409:
      return "Conflict (409). Usually: not your turn.";
    default:
      return `Request failed (${status}).`;
  }
};

export default function BoardGame() {
  const location = useLocation();
  const navigate = useNavigate();

  // =========================
  // ✅ AUTH GUARD (Phase 2 Step 1)
  // =========================
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const myUserId = currentUser?.id ?? null;
  const myUsername = currentUser?.username ?? "Me";

  useEffect(() => {
    if (!currentUser?.id) {
      navigate("/signin", { replace: true });
    }
  }, [currentUser, navigate]);

  // =========================
  // ✅ ROOM ID handling (robust)
  // =========================
  const stateGameId = location?.state?.gameId ?? null;
  const storedRoomId = localStorage.getItem("currentRoomId");

  const roomId = useMemo(() => {
    const picked = stateGameId ?? storedRoomId;
    return picked != null ? String(picked) : null;
  }, [stateGameId, storedRoomId]);

  // persist roomId when it comes from navigation state
  useEffect(() => {
    if (stateGameId != null) {
      localStorage.setItem("currentRoomId", String(stateGameId));
    }
  }, [stateGameId]);

  // if no roomId, go back
  useEffect(() => {
    if (!roomId) navigate("/rooms", { replace: true });
  }, [roomId, navigate]);

  // =========================
  // ✅ STATE + UI
  // =========================
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);

  // network banner for polling issues
  const [netError, setNetError] = useState("");

  // ✅ user-facing UI error banner (Phase 2 Step 4)
  const [uiError, setUiError] = useState("");
  const uiErrorTimerRef = useRef(null);
  const showUiError = (msg, ms = 3500) => {
    setUiError(msg || "");
    if (uiErrorTimerRef.current) clearTimeout(uiErrorTimerRef.current);
    if (msg) {
      uiErrorTimerRef.current = setTimeout(() => setUiError(""), ms);
    }
  };

  // ✅ last applied prize card UI (fixed region)
  const [lastCard, setLastCard] = useState(null);

  // local clock (smooth timer UI)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // =========================
  // ✅ CHAT (Phase 2 Step 2)
  // =========================
  const [chatMsgs, setChatMsgs] = useState([]); // [{id,userId,username,text,createdAt}]
  const [chatText, setChatText] = useState("");
  const [chatErr, setChatErr] = useState("");
  const lastChatIdRef = useRef(null);
  const chatListRef = useRef(null);

  const scrollChatToBottom = () => {
    const el = chatListRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  // networking refs
  const abortRef = useRef(null);
  const isFetchingRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);

  // adaptive polling (Phase 2 Step 4)
  const pollTimerRef = useRef(null);
  const pollMsRef = useRef(POLL_MS);

  // prevents multiple /timeout fires for same turnEndsAt
  const lastTimeoutTurnEndsAtRef = useRef(null);

  // request in-flight guards (Phase 2 Step 4)
  const answerInFlightRef = useRef(false);
  const timeoutInFlightRef = useRef(false);
  const chatSendInFlightRef = useRef(false);

  const buildUrl = (path) => `${API_BASE}${path}`;

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    isFetchingRef.current = false;
  };

  const schedulePolling = (ms) => {
    pollMsRef.current = ms;
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(tick, pollMsRef.current);
  };

  // leave helper used by Step 4 safety redirects
  const forceLeaveToRooms = (reason) => {
    try {
      stopPolling();
    } finally {
      localStorage.removeItem("currentRoomId");
      if (reason) showUiError(reason, 2200);
      navigate("/rooms", { replace: true });
    }
  };

  // =========================
  // ✅ FETCH: state + chat
  // =========================
  const fetchState = async (signal) => {
    const res = await fetch(buildUrl(`/api/games/${roomId}/state`), { signal });

    if (!res.ok) {
      const body = await safeJson(res);
      const err = new Error(`State fetch failed (${res.status}): ${String(body)}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return res.json();
  };

  // backend: GET /api/games/{gameId}/chat?afterId=...
  const fetchChat = async (signal) => {
    const afterId = lastChatIdRef.current;
    const qs = afterId ? `?afterId=${afterId}` : "";
    const res = await fetch(buildUrl(`/api/games/${roomId}/chat${qs}`), { signal });

    if (!res.ok) {
      const body = await safeJson(res);
      const err = new Error(`Chat fetch failed (${res.status}): ${String(body)}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return res.json();
  };

  const tick = async () => {
    if (!roomId) return;
    if (!myUserId) return;
    if (document.hidden) return; // pause when tab hidden
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setNetError("");

    // abort previous batch
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const [stateData, chatData] = await Promise.all([
        fetchState(controller.signal),
        fetchChat(controller.signal),
      ]);

      // state (some controllers wrap in {state})
      const st = stateData?.state ? stateData.state : stateData;
      setGameState(st);
      setLoading(false);

      // ✅ FINISHED handling (Phase 2 Step 4)
      if (st?.status && String(st.status).toUpperCase() === "FINISHED") {
        showUiError("This game is finished. You can go back to Rooms.", 5000);

        // ✅ OPTIONAL: stop polling after finished (clean)
        stopPolling();
      }

      // chat (incremental)
      if (Array.isArray(chatData) && chatData.length > 0) {
        setChatMsgs((prev) => {
          // if first load (afterId null) backend may return last batch: replace
          if (!lastChatIdRef.current) return chatData;

          // incremental: append only new
          const existingIds = new Set(prev.map((m) => m.id));
          const merged = [...prev];
          for (const m of chatData) {
            if (m?.id && !existingIds.has(m.id)) merged.push(m);
          }
          // keep last ~150 messages client-side
          if (merged.length > 150) merged.splice(0, merged.length - 150);
          return merged;
        });

        const last = chatData[chatData.length - 1];
        if (last?.id) lastChatIdRef.current = last.id;

        setChatErr("");
        setTimeout(scrollChatToBottom, 0);
      }

      // reset error/backoff on success
      consecutiveErrorsRef.current = 0;
      if (pollMsRef.current !== POLL_MS) schedulePolling(POLL_MS);
    } catch (e) {
      if (e?.name === "AbortError") return;

      consecutiveErrorsRef.current += 1;

      // Step 4: hard redirects for forbidden/not-found (room/user mismatch)
      const st = e?.status;
      if (st === 404) {
        forceLeaveToRooms("Room not found anymore. Returning to Rooms…");
        return;
      }
      if (st === 403) {
        forceLeaveToRooms("You are not in this room. Returning to Rooms…");
        return;
      }
      if (st === 401) {
        localStorage.removeItem("user");
        showUiError("Session expired. Please sign in again.", 2500);
        navigate("/signin", { replace: true });
        return;
      }

      // polling banner + backoff
      const msg =
        consecutiveErrorsRef.current >= 2
          ? `Connection issue. Retrying… (${consecutiveErrorsRef.current})`
          : "Connection issue. Retrying…";
      setNetError(msg);

      // backoff levels: 1.2s -> 2.5s -> 4s -> 6s
      const n = consecutiveErrorsRef.current;
      const nextMs = n >= 10 ? 6000 : n >= 6 ? 4000 : n >= 3 ? 2500 : POLL_MS;
      if (pollMsRef.current !== nextMs) schedulePolling(nextMs);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // start polling
  useEffect(() => {
    if (!roomId || !myUserId) return;

    setLoading(true);
    setGameState(null);
    setNetError("");
    setUiError("");
    setChatMsgs([]);
    setChatErr("");
    lastChatIdRef.current = null;
    consecutiveErrorsRef.current = 0;

    stopPolling();
    tick(); // immediate
    schedulePolling(POLL_MS);

    const onVisibility = () => {
      if (!document.hidden) tick(); // refresh immediately when user returns
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopPolling();
      if (uiErrorTimerRef.current) clearTimeout(uiErrorTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myUserId]);

  // =========================
  // ✅ LEAVE ROOM (Phase 2 Step 3)
  // =========================
  const leaveRoom = async () => {
    try {
      stopPolling();
      if (roomId && myUserId) {
        await fetch(buildUrl(`/api/games/${roomId}/leave?userId=${myUserId}`), {
          method: "POST",
        });
      }
    } catch {
      // ignore; still leave UI
    } finally {
      localStorage.removeItem("currentRoomId");
      navigate("/rooms");
    }
  };

  // =========================
  // ✅ TIMEOUT (auto when timer hits 0 on your turn)
  // =========================
  const postTimeout = async () => {
    if (!roomId || !myUserId) return;
    if (timeoutInFlightRef.current) return;

    timeoutInFlightRef.current = true;
    try {
      const res = await fetch(buildUrl(`/api/games/${roomId}/timeout`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(myUserId) }),
      });

      if (!res.ok) {
        const body = await safeJson(res);
        showUiError(`${msgFromStatus(res.status)} ${String(body ?? "")}`.trim());
      }
      // polling will refresh state
    } catch {
      showUiError("Network error while timing out.");
    } finally {
      timeoutInFlightRef.current = false;
    }
  };

  // =========================
  // Derived values
  // =========================
  const players = gameState?.players || [];
  const activeSlot = gameState?.activeSlot ?? 1;
  const turnEndsAt = gameState?.turnEndsAt ?? null;
  const question = gameState?.question ?? null;

  const gameStatus = (gameState?.status ?? "").toString().toUpperCase();
  const isFinished = gameStatus === "FINISHED";

  // ✅ NEW: winner fields from backend state
  const winnerUsername = gameState?.winnerUsername ?? null;
  const winnerUserId = gameState?.winnerUserId ?? null;
  const finishedAt = gameState?.finishedAt ?? null;

  const mySlot = useMemo(() => {
    if (!myUserId) return null;
    const me = players.find((p) => String(p.userId) === String(myUserId));
    return me?.slot ?? null;
  }, [players, myUserId]);

  const isMyTurn = mySlot != null && mySlot === activeSlot && !isFinished;

  const timeLeftSeconds = useMemo(() => {
    if (!turnEndsAt) return 0;
    const diffMs = turnEndsAt - now;
    return Math.max(0, Math.ceil(diffMs / 1000));
  }, [turnEndsAt, now]);

  const activePlayerName = useMemo(() => {
    const p = players.find((x) => x.slot === activeSlot);
    return formatName8(p?.username, `P${activeSlot}`);
  }, [players, activeSlot]);

  // Step 4: if server says you're not among players, leave safely
  useEffect(() => {
    if (!loading && roomId && myUserId && gameState) {
      const inRoom = players.some((p) => String(p.userId) === String(myUserId));
      // allow temporary empty list during start, but not after load
      if (players.length > 0 && !inRoom && !isFinished) {
        forceLeaveToRooms("You are no longer in this room. Returning to Rooms…");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, roomId, myUserId, players.length, isFinished]);

  // auto-timeout once (per turnEndsAt) when timer hits 0 on my turn
  useEffect(() => {
    if (!turnEndsAt) return;
    if (!isMyTurn) return;

    if (timeLeftSeconds <= 0) {
      if (lastTimeoutTurnEndsAtRef.current !== turnEndsAt) {
        lastTimeoutTurnEndsAtRef.current = turnEndsAt;
        postTimeout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftSeconds, isMyTurn, turnEndsAt]);

  // map players into board tokens
  const boardPlayers = useMemo(() => {
    const tokenColors = ["green", "blue", "orange", "red"];
    return players.map((p) => ({
      id: p.slot,
      color: tokenColors[(p.slot - 1) % tokenColors.length],
      position: p.position ?? 0,
      name: formatName8(p.username, `P${p.slot}`),
      userId: p.userId,
    }));
  }, [players]);

  // =========================
  // ✅ PRIZE REGION (fixed pixel region)
  // =========================
  const PrizeRegion = () => {
    const hasCard = !!lastCard;

    return (
      <div style={styles.prizeRegion}>
        <div style={styles.prizeHeader}>🎴 Prize Card</div>

        <div style={styles.prizeBody}>
          {hasCard ? (
            <>
              <div style={styles.prizeTitle}>
                {lastCard.icon ? `${lastCard.icon} ` : ""}
                {lastCard.title || lastCard.code || "Card"}
              </div>

              <div style={styles.prizeDesc}>
                {lastCard.description || "Applied immediately."}
              </div>

              <div style={styles.prizeMeta}>
                {lastCard.code ? `Code: ${lastCard.code}` : ""}
              </div>
            </>
          ) : (
            <div style={styles.prizeEmpty}>No card yet. Answer correctly to get one.</div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setLastCard(null)}
          style={{
            ...styles.prizeClearBtn,
            opacity: hasCard ? 1 : 0.5,
            cursor: hasCard ? "pointer" : "not-allowed",
          }}
          disabled={!hasCard}
        >
          Clear
        </button>
      </div>
    );
  };

  // =========================
  // Guards
  // =========================
  if (!roomId) return null;

  if (!myUserId) {
    return (
      <div style={{ color: "white", padding: "20px" }}>
        <h2>Redirecting…</h2>
        <p>Please sign in.</p>
      </div>
    );
  }

  // =========================
  // CHAT SEND (deduped handler)
  // =========================
  const sendChat = async () => {
    if (isFinished) {
      showUiError("Game finished — chat disabled.");
      return;
    }
    if (!roomId || !myUserId) return;
    const t = chatText.trim();
    if (!t) return;
    if (chatSendInFlightRef.current) return;

    chatSendInFlightRef.current = true;
    setChatText("");

    try {
      const res = await fetch(buildUrl(`/api/games/${roomId}/chat`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(myUserId), text: t }),
      });

      if (!res.ok) {
        const body = await safeJson(res);
        setChatErr(`Chat send failed (${res.status}): ${String(body)}`);
        showUiError(`${msgFromStatus(res.status)} ${String(body ?? "")}`.trim());
        return;
      }

      const msg = await res.json();
      setChatErr("");

      if (msg?.id) {
        lastChatIdRef.current = msg.id;
        setChatMsgs((prev) => {
          const exists = prev.some((x) => x.id === msg.id);
          const merged = exists ? prev : [...prev, msg];
          if (merged.length > 150) merged.splice(0, merged.length - 150);
          return merged;
        });
        setTimeout(scrollChatToBottom, 0);
      }
    } catch {
      setChatErr("Network error while sending chat.");
      showUiError("Network error while sending chat.");
    } finally {
      chatSendInFlightRef.current = false;
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <>
      <video autoPlay muted loop playsInline className="background-video">
        <source src="/background.mp4" type="video/mp4" />
      </video>

      <div className="background-overlay" />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={styles.topBar}>
          <h1 style={{ margin: 0, textAlign: "center" }}>🧠 Space Explorer Game Board</h1>

          <div style={styles.topRight}>
            <button onClick={tick} style={styles.topBtn} disabled={loading}>
              Refresh
            </button>
            <button onClick={leaveRoom} style={{ ...styles.topBtn, background: "#ffe9e9" }}>
              Leave Room
            </button>
          </div>
        </div>

        {/* Step 4: UI error banner */}
        {uiError && (
          <div style={styles.uiBanner}>
            {uiError}
            <button
              onClick={() => setUiError("")}
              style={styles.uiBannerClose}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {netError && <div style={styles.netBanner}>{netError}</div>}

        {/* ✅ UPDATED: finished banner shows winner + finishedAt */}
        {isFinished && (
          <div style={styles.finishedBanner}>
            <div style={{ fontWeight: 900 }}>
              🏁 Game Finished
              {winnerUsername ? (
                <>
                  {" • "}🏆 Winner:{" "}
                  <span style={{ textDecoration: "underline" }}>{winnerUsername}</span>
                </>
              ) : null}
            </div>

            {finishedAt ? (
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                Finished at: {new Date(finishedAt).toLocaleString()}
              </div>
            ) : null}

            <div style={{ marginTop: 10 }}>
              <button onClick={() => forceLeaveToRooms()} style={styles.finishedBtn}>
                Back to Rooms
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ color: "white", textAlign: "center", marginTop: 20 }}>
            Loading game state...
          </div>
        )}

        {!loading && gameState && (
          <>
            <div style={styles.cardRow}>
              <QuestionTextCard
                questionText={question?.content || ""}
                questionId={question?.id || null}
                hasImage={!!question?.hasImage}
              />

              <QuestionCard
                playerId={activeSlot}
                playerName={activePlayerName}
                isMyTurn={isMyTurn}
                isFinished={isFinished}              // ✅ NEW
                winnerUsername={winnerUsername}      // ✅ NEW
                onSubmitAnswer={async (answerText) => {
                  if (isFinished) {
                    showUiError("Game finished — answering disabled.");
                    return;
                  }
                  if (answerInFlightRef.current) return;

                  answerInFlightRef.current = true;
                  try {
                    const res = await fetch(buildUrl(`/api/games/${roomId}/answer`), {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: Number(myUserId), answer: answerText }),
                    });

                    if (!res.ok) {
                      const body = await safeJson(res);
                      showUiError(`${msgFromStatus(res.status)} ${String(body ?? "")}`.trim(), 4500);
                      throw new Error(String(body ?? "Answer failed"));
                    }

                    const data = await res.json();
                    const nextState = data?.state ? data.state : data;
                    setGameState(nextState);

                    const card =
                      data?.appliedCard || data?.drawnCard || data?.card || data?.reward || null;

                    if (card) setLastCard(card);

                    return data;
                  } finally {
                    answerInFlightRef.current = false;
                  }
                }}
              />

              <PrizeRegion />

              <div style={styles.timerCard}>
                <h3>Current Turn</h3>
                <p>
                  <strong>{activePlayerName}</strong>
                </p>
                <p style={styles.timerText}>⏳ Time Left: {timeLeftSeconds}s</p>

                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
                  {isFinished ? "Finished 🏁" : isMyTurn ? "Your turn ✅" : "Waiting…"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "80px", paddingBottom: "20px" }}>
              <div style={styles.boardContainer}>
                <Board players={boardPlayers} />
              </div>
            </div>

            {/* ✅ LOBBY CHAT */}
            <div style={styles.chatWrap}>
              <div style={styles.chatHeader}>
                💬 Lobby Chat
                <span style={{ fontSize: 12, opacity: 0.8, marginLeft: 10 }}>
                  ({formatName8(myUsername, "Me")})
                </span>
              </div>

              <div ref={chatListRef} style={styles.chatList}>
                {chatMsgs.length === 0 ? (
                  <div style={{ opacity: 0.8 }}>No messages yet…</div>
                ) : (
                  chatMsgs.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        ...styles.chatMsg,
                        alignSelf:
                          String(m.userId) === String(myUserId) ? "flex-end" : "flex-start",
                        background:
                          String(m.userId) === String(myUserId)
                            ? "rgba(59,130,246,0.35)"
                            : "rgba(255,255,255,0.10)",
                      }}
                    >
                      <div style={styles.chatMeta}>
                        <strong>{formatName8(m.username, "Player")}</strong>
                        <span style={{ opacity: 0.7, marginLeft: 8, fontSize: 11 }}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}
                        </span>
                      </div>
                      <div style={styles.chatText}>{m.text}</div>
                    </div>
                  ))
                )}
              </div>

              {chatErr && <div style={styles.chatErr}>{chatErr}</div>}

              <div style={styles.chatInputRow}>
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder={isFinished ? "Game finished…" : "Type a message…"}
                  style={{
                    ...styles.chatInput,
                    opacity: isFinished ? 0.6 : 1,
                    cursor: isFinished ? "not-allowed" : "text",
                  }}
                  maxLength={280}
                  disabled={isFinished}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                />
                <button
                  onClick={sendChat}
                  style={{
                    ...styles.chatSendBtn,
                    opacity: isFinished || !chatText.trim() ? 0.5 : 1,
                    cursor: isFinished || !chatText.trim() ? "not-allowed" : "pointer",
                  }}
                  disabled={isFinished || !chatText.trim()}
                >
                  Send
                </button>
              </div>

              <div style={styles.chatFooterNote}>
                Polling: {pollMsRef.current}ms • Incremental chat • Pauses when tab hidden
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

const styles = {
  topBar: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "18px 16px 0 16px",
    position: "relative",
  },
  topRight: {
    position: "absolute",
    right: 16,
    top: 18,
    display: "flex",
    gap: 8,
  },
  topBtn: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  },

  uiBanner: {
    maxWidth: 900,
    margin: "10px auto",
    padding: "10px 14px",
    borderRadius: 10,
    background: "rgba(239,68,68,0.25)",
    border: "1px solid rgba(239,68,68,0.55)",
    color: "white",
    textAlign: "center",
    position: "relative",
  },
  uiBannerClose: {
    position: "absolute",
    right: 10,
    top: 8,
    border: "none",
    background: "transparent",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 14,
    opacity: 0.9,
  },

  netBanner: {
    maxWidth: 900,
    margin: "10px auto",
    padding: "10px 14px",
    borderRadius: 10,
    background: "rgba(245,158,11,0.30)",
    border: "1px solid rgba(245,158,11,0.55)",
    color: "white",
    textAlign: "center",
  },

  finishedBanner: {
    maxWidth: 900,
    margin: "10px auto",
    padding: "10px 14px",
    borderRadius: 10,
    background: "rgba(34,197,94,0.20)",
    border: "1px solid rgba(34,197,94,0.45)",
    color: "white",
    textAlign: "center",
  },
  finishedBtn: {
    marginLeft: 10,
    padding: "6px 10px",
    borderRadius: 10,
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
  },

  cardRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: "22px",
    marginTop: "28px",
    flexWrap: "wrap",
  },

  boardContainer: {
    marginTop: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  timerCard: {
    border: "2px solid #2196f3",
    padding: "20px",
    borderRadius: "12px",
    width: "250px",
    backgroundColor: "#e3f2fd",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  },

  timerText: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#0d47a1",
    marginTop: "10px",
  },

  prizeRegion: {
    width: 260,
    height: 190,
    borderRadius: 14,
    border: "2px solid rgba(250, 204, 21, 0.95)",
    background: "rgba(17, 24, 39, 0.92)",
    color: "white",
    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  prizeHeader: {
    padding: "10px 12px",
    fontWeight: 800,
    fontSize: 14,
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.18)",
  },
  prizeBody: {
    padding: 12,
    flex: 1,
    overflow: "hidden",
  },
  prizeTitle: {
    fontSize: 16,
    fontWeight: 800,
    lineHeight: "18px",
    marginBottom: 8,
    maxHeight: 38,
    overflow: "hidden",
  },
  prizeDesc: {
    fontSize: 13,
    opacity: 0.92,
    lineHeight: "16px",
    maxHeight: 64,
    overflow: "hidden",
  },
  prizeMeta: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.7,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  prizeEmpty: {
    fontSize: 13,
    opacity: 0.85,
    lineHeight: "16px",
  },
  prizeClearBtn: {
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(250, 204, 21, 0.92)",
    color: "#111827",
    fontWeight: 800,
    padding: "10px 12px",
  },

  // ✅ CHAT STYLES
  chatWrap: {
    maxWidth: 900,
    margin: "20px auto 60px auto",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(17, 24, 39, 0.75)",
    color: "white",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
  },
  chatHeader: {
    padding: "10px 12px",
    fontWeight: 800,
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
  },
  chatList: {
    height: 220,
    padding: 12,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  chatMsg: {
    maxWidth: "75%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
  },
  chatMeta: {
    fontSize: 12,
    marginBottom: 6,
    opacity: 0.95,
  },
  chatText: {
    fontSize: 14,
    lineHeight: "18px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  chatErr: {
    padding: "8px 12px",
    background: "rgba(185,28,28,0.75)",
    borderTop: "1px solid rgba(255,255,255,0.12)",
    fontSize: 13,
  },
  chatInputRow: {
    display: "flex",
    gap: 10,
    padding: 12,
    borderTop: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.14)",
  },
  chatInput: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    outline: "none",
    background: "rgba(255,255,255,0.10)",
    color: "white",
  },
  chatSendBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
    background: "rgba(34,197,94,0.85)",
    color: "#0b1220",
    opacity: 1,
  },
  chatFooterNote: {
    padding: "8px 12px",
    borderTop: "1px solid rgba(255,255,255,0.10)",
    fontSize: 12,
    opacity: 0.65,
    background: "rgba(0,0,0,0.10)",
  },
};
