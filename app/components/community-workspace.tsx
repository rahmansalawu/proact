"use client";

import { BookOpenCheck, MessageCircle, Plus, Send, ThumbsUp, Toolbox, UsersRound, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { ModuleKey } from "../lib/modules";

type RecordRow = {
  id: string;
  module: ModuleKey;
  reference: string;
  title: string;
  status: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  owner: string;
  dueDate: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
type SaveInput = Omit<RecordRow, "id" | "reference" | "createdAt" | "updatedAt"> & { id?: string };
const asText = (value: unknown) => typeof value === "string" ? value : "";
const asNumber = (value: unknown) => Number(value) || 0;

export function CommunityWorkspace({ records, allRecords, actorName, saving, onSave }: { records: RecordRow[]; allRecords: RecordRow[]; actorName: string; saving: boolean; onSave: (input: SaveInput) => Promise<void> }) {
  const [composer, setComposer] = useState(false);
  const [view, setView] = useState<"feed" | "lessons" | "toolbox">("feed");
  const posts = useMemo(() => [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [records]);
  const incidentLessons = allRecords.filter((record) => record.module === "incidents" && asText(record.payload.lessonLearnt));
  const visible = view === "feed" ? posts : view === "toolbox" ? posts.filter((record) => ["Toolbox talk", "Video / podcast"].includes(asText(record.payload.contentType))) : posts.filter((record) => asText(record.payload.contentType) === "Lesson learned");

  const update = async (record: RecordRow, payload: Record<string, unknown>) => {
    await onSave({ id: record.id, module: "community", title: record.title, status: record.status, priority: record.priority, owner: record.owner, dueDate: record.dueDate, payload });
  };
  const publishLesson = async (incident: RecordRow) => {
    await onSave({ module: "community", title: `Lesson learnt: ${incident.title}`, status: "Published", priority: incident.priority, owner: actorName, dueDate: null, payload: { contentType: "Lesson learned", topic: asText(incident.payload.eventType) || "Incident learning", body: asText(incident.payload.lessonLearnt), sourceRecord: incident.reference, mediaUrl: "", reactions: 0, comments: [] } });
  };

  return <div className="page community-page">
    <div className="page-heading community-heading"><div><span className="eyebrow">MODULE 11 OF 12 · CONNECTED LEARNING</span><h1>Community & Knowledge</h1><p>Turn operational evidence into searchable lessons, toolbox talks and professional discussion.</p></div><button className="primary-button" onClick={() => setComposer(true)}><Plus size={16} /> Create content</button></div>
    <section className="community-unit-grid">
      <button className={view === "feed" ? "active" : ""} onClick={() => setView("feed")}><UsersRound size={18} /><div><strong>Knowledge feed</strong><span>{posts.length} published items</span></div></button>
      <button className={view === "lessons" ? "active" : ""} onClick={() => setView("lessons")}><BookOpenCheck size={18} /><div><strong>Lessons learnt</strong><span>{incidentLessons.length} incident lessons ready</span></div></button>
      <button className={view === "toolbox" ? "active" : ""} onClick={() => setView("toolbox")}><Toolbox size={18} /><div><strong>Toolbox library</strong><span>Talks, briefings and media</span></div></button>
    </section>
    {view === "lessons" && incidentLessons.length > 0 && <section className="lesson-publish-panel"><div><strong>Incident lessons awaiting publication</strong><span>Publish controlled learning without retyping the investigation.</span></div>{incidentLessons.map((incident) => {
      const exists = records.some((record) => record.payload.sourceRecord === incident.reference);
      return <article key={incident.id}><div><strong>{incident.title}</strong><span>{incident.reference} · {asText(incident.payload.eventType)}</span></div><button className="secondary-button" disabled={saving || exists} onClick={() => void publishLesson(incident)}>{exists ? "Published" : "Publish lesson"}</button></article>;
    })}</section>}
    <section className="knowledge-feed">
      {visible.length ? visible.map((record) => <KnowledgePost key={record.id} record={record} actorName={actorName} onUpdate={(payload) => update(record, payload)} />) : <div className="marketplace-empty"><span><MessageCircle size={26} /></span><h2>No content in this view</h2><p>Create a safety update, article, toolbox talk or publish a completed incident lesson.</p><button className="primary-button" onClick={() => setComposer(true)}>Create first item</button></div>}
    </section>
    {composer && <CommunityComposer actorName={actorName} saving={saving} onClose={() => setComposer(false)} onSave={async (input) => { await onSave(input); setComposer(false); }} />}
  </div>;
}

function KnowledgePost({ record, actorName, onUpdate }: { record: RecordRow; actorName: string; onUpdate: (payload: Record<string, unknown>) => Promise<void> }) {
  const [comment, setComment] = useState("");
  const comments = Array.isArray(record.payload.comments) ? record.payload.comments as Array<{ author: string; body: string; createdAt: string }> : [];
  return <article className="knowledge-post">
    <header><div className="knowledge-avatar">{record.owner.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</div><div><strong>{record.owner}{record.payload.simulatedData === true && <em className="simulated-badge">Simulated</em>}</strong><span>{asText(record.payload.contentType)} · {asText(record.payload.topic)} · {record.reference}</span></div><b>{record.status}</b></header>
    <h2>{record.title}</h2><p>{asText(record.payload.body)}</p>
    {asText(record.payload.sourceRecord) && <div className="source-record">Controlled source: <strong>{asText(record.payload.sourceRecord)}</strong></div>}
    <div className="knowledge-actions"><button onClick={() => void onUpdate({ ...record.payload, reactions: asNumber(record.payload.reactions) + 1 })}><ThumbsUp size={14} /> Useful {asNumber(record.payload.reactions)}</button><span><MessageCircle size={14} /> {comments.length} comments</span></div>
    {comments.map((item, index) => <div className="knowledge-comment" key={`${item.createdAt}-${index}`}><strong>{item.author}</strong><span>{item.body}</span></div>)}
    <form onSubmit={(event) => { event.preventDefault(); if (!comment.trim()) return; void onUpdate({ ...record.payload, comments: [...comments, { author: actorName, body: comment.trim(), createdAt: new Date().toISOString() }] }); setComment(""); }}><input aria-label={`Comment on ${record.title}`} value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} placeholder="Add a professional comment…" /><button aria-label="Post comment"><Send size={14} /></button></form>
  </article>;
}

function CommunityComposer({ actorName, saving, onClose, onSave }: { actorName: string; saving: boolean; onClose: () => void; onSave: (input: SaveInput) => Promise<void> }) {
  const [contentType, setContentType] = useState("Safety update");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({ module: "community", title, status: "Published", priority: "Low", owner: actorName, dueDate: null, payload: { contentType, topic, body, mediaUrl, sourceRecord: "", moderationNotes: "", reactions: 0, comments: [] } });
  };
  return <div className="drawer-backdrop"><aside className="record-drawer community-composer" role="dialog" aria-modal="true" aria-labelledby="community-composer-title">
    <div className="drawer-header"><div><span className="eyebrow">CONNECTED LEARNING</span><h2 id="community-composer-title">Create knowledge item</h2></div><button className="icon-button" onClick={onClose} aria-label="Close composer"><X size={18} /></button></div>
    <form onSubmit={submit}>
      <label>Content type<select value={contentType} onChange={(event) => setContentType(event.target.value)}><option>Safety update</option><option>Lesson learned</option><option>Article</option><option>Toolbox talk</option><option>Discussion</option><option>Video / podcast</option></select></label>
      <label>Title<input required maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>Topic<input required maxLength={120} value={topic} onChange={(event) => setTopic(event.target.value)} /></label>
      <label>Content<textarea required rows={8} maxLength={8000} value={body} onChange={(event) => setBody(event.target.value)} /></label>
      <label>Media URL<input type="url" value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} /></label>
      <div className="editor-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Publishing…" : "Publish"}</button></div>
    </form>
  </aside></div>;
}
