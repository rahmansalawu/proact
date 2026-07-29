"use client";

import {
  BadgePoundSterling,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Filter,
  Link,
  MapPin,
  MessageCircle,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Star,
  ThumbsUp,
  UserRound,
  UsersRound,
  X,
  Video,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { ModuleKey } from "../lib/modules";

type MarketplaceRecord = {
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

type SaveInput = Omit<MarketplaceRecord, "id" | "reference" | "createdAt" | "updatedAt"> & { id?: string };
type Tab = "discover" | "engagements" | "community" | "profile";
type Editor = { kind: "profile" | "engagement" | "post"; record?: MarketplaceRecord; consultant?: MarketplaceRecord } | null;

const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number(value) || 0;
const list = (value: unknown) => Array.isArray(value) ? value.map(String) : text(value).split(",").map((item) => item.trim()).filter(Boolean);

function externalUrl(value: unknown) {
  try {
    const parsed = new URL(text(value));
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch { return ""; }
}

function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1).split("/")[0];
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(parsed.hostname)) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v") ?? "";
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] ?? "";
    }
  } catch { return ""; }
  return "";
}

function score(profile: MarketplaceRecord, engagements: MarketplaceRecord[]) {
  const linkedRatings = engagements
    .filter((item) => text(item.payload.consultantId) === profile.id && item.status === "Completed")
    .map((item) => number(item.payload.clientRating))
    .filter((rating) => rating >= 1 && rating <= 5);
  const baseRating = number(profile.payload.rating);
  const baseCount = number(profile.payload.reviewCount);
  const total = baseCount + linkedRatings.length;
  const rating = total ? ((baseRating * baseCount) + linkedRatings.reduce((sum, value) => sum + value, 0)) / total : 0;
  const trust = Math.min(100, Math.round((rating / 5) * 70 + (profile.payload.verified ? 20 : 0) + Math.min(total, 10)));
  return { rating, reviews: total, trust };
}

export function MarketplaceWorkspace({
  records,
  actor,
  saving,
  onSave,
}: {
  records: MarketplaceRecord[];
  actor: { displayName: string; email: string; demoMode: boolean };
  saving: boolean;
  onSave: (input: SaveInput) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("discover");
  const [editor, setEditor] = useState<Editor>(null);
  const [location, setLocation] = useState("");
  const [specialism, setSpecialism] = useState("");
  const [jurisdiction, setJurisdiction] = useState("UK");
  const [availability, setAvailability] = useState("All");
  const [maxRate, setMaxRate] = useState("");
  const [minimumRating, setMinimumRating] = useState("0");

  const profiles = useMemo(() => records.filter((record) => record.payload.marketplaceType === "consultant"), [records]);
  const engagements = useMemo(() => records.filter((record) => record.payload.marketplaceType === "engagement"), [records]);
  const posts = useMemo(() => records.filter((record) => record.payload.marketplaceType === "post").sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [records]);
  const myProfile = profiles.find((profile) => text(profile.payload.ownerEmail).toLowerCase() === actor.email.toLowerCase());
  const filteredProfiles = profiles.filter((profile) => {
    const metrics = score(profile, engagements);
    const haystack = list(profile.payload.specialisms).join(" ").toLowerCase();
    return (!location || text(profile.payload.location).toLowerCase().includes(location.toLowerCase()))
      && (!specialism || haystack.includes(specialism.toLowerCase()))
      && (!jurisdiction || list(profile.payload.jurisdictions).some((item) => item.toLowerCase().includes(jurisdiction.toLowerCase())))
      && (availability === "All" || text(profile.payload.availability) === availability)
      && (!maxRate || number(profile.payload.dailyRate) <= Number(maxRate))
      && metrics.rating >= Number(minimumRating);
  });

  const update = async (record: MarketplaceRecord, payload: Record<string, unknown>, status = record.status) => {
    await onSave({ id: record.id, module: "marketplace", title: record.title, status, priority: record.priority, owner: record.owner, dueDate: record.dueDate, payload });
  };

  return <div className="page marketplace-page">
    <div className="marketplace-hero">
      <div><span className="eyebrow">MODULE 12 · PROFESSIONAL SERVICES</span><h1>Consultant Marketplace</h1><p>Find verified UK HSE expertise, agree work, collaborate and build trust through auditable engagements.</p></div>
      <div className="marketplace-hero-actions">
        <button className="secondary-button" onClick={() => { setTab("profile"); setEditor({ kind: "profile", record: myProfile }); }}><UserRound size={16} />{myProfile ? "Edit my profile" : "Create profile"}</button>
        <button className="primary-button" onClick={() => setEditor({ kind: "engagement" })}><Plus size={16} /> Post a brief</button>
      </div>
    </div>

    <div className="marketplace-notice"><ShieldCheck size={17} /><div><strong>Marketplace test environment</strong><span>Profiles and workflows are functional. Escrow is simulated and never moves money; LinkedIn OAuth awaits production credentials.</span></div></div>

    <nav className="marketplace-tabs" aria-label="Marketplace sections">
      <button className={tab === "discover" ? "active" : ""} onClick={() => setTab("discover")}><Search size={16} /> Discover <b>{profiles.length}</b></button>
      <button className={tab === "engagements" ? "active" : ""} onClick={() => setTab("engagements")}><BriefcaseBusiness size={16} /> Engagements <b>{engagements.length}</b></button>
      <button className={tab === "community" ? "active" : ""} onClick={() => setTab("community")}><UsersRound size={16} /> Community <b>{posts.length}</b></button>
      <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}><UserRound size={16} /> My profile</button>
    </nav>

    {tab === "discover" && <section className="marketplace-layout">
      <aside className="marketplace-filters">
        <div className="marketplace-section-title"><Filter size={16} /><div><strong>Discovery filters</strong><span>Narrow by expertise and fit</span></div></div>
        <label>Location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Manchester" /></label>
        <label>Specialism<input value={specialism} onChange={(event) => setSpecialism(event.target.value)} placeholder="e.g. CDM, ISO 45001" /></label>
        <label>Jurisdiction expertise<input value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)} placeholder="UK" /></label>
        <label>Availability<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option>All</option><option>Available now</option><option>Available this month</option><option>Unavailable</option></select></label>
        <label>Maximum day rate (£)<input type="number" min="0" value={maxRate} onChange={(event) => setMaxRate(event.target.value)} placeholder="Any rate" /></label>
        <label>Minimum rating<select value={minimumRating} onChange={(event) => setMinimumRating(event.target.value)}><option value="0">Any rating</option><option value="4">4+ stars</option><option value="4.5">4.5+ stars</option></select></label>
        <button className="text-button" onClick={() => { setLocation(""); setSpecialism(""); setJurisdiction("UK"); setAvailability("All"); setMaxRate(""); setMinimumRating("0"); }}>Clear filters</button>
      </aside>
      <div className="marketplace-results">
        <div className="marketplace-results-heading"><div><h2>UK HSE professionals</h2><p>{filteredProfiles.length} of {profiles.length} profiles match your criteria</p></div></div>
        {filteredProfiles.length ? <div className="consultant-grid">{filteredProfiles.map((profile) => <ConsultantCard key={profile.id} profile={profile} metrics={score(profile, engagements)} onEngage={() => setEditor({ kind: "engagement", consultant: profile })} />)}</div>
          : <MarketplaceEmpty icon={<Search size={25} />} title={profiles.length ? "No consultants match those filters" : "No consultant profiles yet"} text={profiles.length ? "Adjust the discovery filters to widen the results." : "Create the first professional profile to activate discovery."} action={<button className="primary-button" onClick={() => setEditor({ kind: "profile" })}><Plus size={15} /> Create profile</button>} />}
      </div>
    </section>}

    {tab === "engagements" && <section>
      <div className="marketplace-section-bar"><div><h2>Engagements & test escrow</h2><p>Brief, budget, milestones, sign-off, dispute handling and two-way ratings.</p></div><button className="primary-button" onClick={() => setEditor({ kind: "engagement" })}><Plus size={15} /> New engagement</button></div>
      {engagements.length ? <div className="engagement-list">{engagements.map((record) => <EngagementCard key={record.id} record={record} saving={saving} onEdit={() => setEditor({ kind: "engagement", record })} onUpdate={(payload, status) => update(record, payload, status)} />)}</div>
        : <MarketplaceEmpty icon={<BriefcaseBusiness size={25} />} title="No engagements yet" text="Select a consultant or post a brief to begin an auditable engagement." action={<button className="primary-button" onClick={() => setEditor({ kind: "engagement" })}>Post a brief</button>} />}
    </section>}

    {tab === "community" && <section>
      <div className="marketplace-section-bar"><div><h2>Professional community</h2><p>Short updates, long-form articles, topic threads, reactions, comments and seminar media.</p></div><button className="primary-button" onClick={() => setEditor({ kind: "post" })}><Plus size={15} /> Create post</button></div>
      {posts.length ? <div className="community-feed">{posts.map((record) => <PostCard key={record.id} record={record} actorName={actor.displayName} onUpdate={(payload) => update(record, payload)} />)}</div>
        : <MarketplaceEmpty icon={<MessageCircle size={25} />} title="Start the professional conversation" text="Publish an update, article or topic thread." action={<button className="primary-button" onClick={() => setEditor({ kind: "post" })}>Create first post</button>} />}
    </section>}

    {tab === "profile" && <section>
      <div className="marketplace-section-bar"><div><h2>Professional profile</h2><p>Qualifications, memberships, experience, availability, expertise and public links.</p></div><button className="primary-button" onClick={() => setEditor({ kind: "profile", record: myProfile })}>{myProfile ? "Edit profile" : "Create profile"}</button></div>
      {myProfile ? <div className="profile-preview"><ConsultantCard profile={myProfile} metrics={score(myProfile, engagements)} onEngage={() => setEditor({ kind: "engagement", consultant: myProfile })} expanded /></div>
        : <MarketplaceEmpty icon={<UserRound size={25} />} title="Create your consultant profile" text="A complete profile makes you discoverable to UK organisations seeking HSE expertise." action={<button className="primary-button" onClick={() => setEditor({ kind: "profile" })}>Build my profile</button>} />}
    </section>}

    {editor && <MarketplaceEditor editor={editor} actor={actor} profiles={profiles} saving={saving} onClose={() => setEditor(null)} onSave={async (input) => { await onSave(input); setEditor(null); }} />}
  </div>;
}

function ConsultantCard({ profile, metrics, onEngage, expanded = false }: { profile: MarketplaceRecord; metrics: ReturnType<typeof score>; onEngage: () => void; expanded?: boolean }) {
  const p = profile.payload;
  return <article className={`consultant-card ${expanded ? "expanded" : ""}`}>
    <div className="consultant-card-top"><div className="consultant-avatar">{text(p.displayName).split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</div><div><div className="verified-name"><h3>{text(p.displayName) || profile.title}</h3>{Boolean(p.verified) && <CheckCircle2 size={14} aria-label="Verified profile" />}{p.simulatedData === true && <em className="simulated-badge">Simulated</em>}</div><p>{text(p.headline)}</p><span><MapPin size={12} /> {text(p.location) || "Location not provided"}</span></div><div className="trust-score"><strong>{metrics.trust}</strong><span>TRUST</span></div></div>
    <div className="consultant-metrics"><span><Star size={13} fill="currentColor" /> <strong>{metrics.rating ? metrics.rating.toFixed(1) : "New"}</strong> ({metrics.reviews})</span><span><BriefcaseBusiness size={13} /> {number(p.yearsExperience)} years</span><span className={text(p.availability).startsWith("Available") ? "available" : ""}>{text(p.availability) || "Availability unknown"}</span></div>
    <div className="specialism-tags">{list(p.specialisms).map((item) => <span key={item}>{item}</span>)}</div>
    {expanded && <div className="profile-detail-grid"><div><strong>Qualifications</strong><p>{list(p.qualifications).join(" · ") || "Not provided"}</p></div><div><strong>Memberships</strong><p>{list(p.memberships).join(" · ") || "Not provided"}</p></div><div><strong>Jurisdictions</strong><p>{list(p.jurisdictions).join(" · ") || "Not provided"}</p></div><div className="wide"><strong>About</strong><p>{text(p.bio) || "No biography provided."}</p></div></div>}
    <div className="consultant-card-bottom"><div><strong>£{number(p.dailyRate).toLocaleString("en-GB")}</strong><span> per day</span></div><div className="profile-links">{externalUrl(p.linkedInUrl) && <a href={externalUrl(p.linkedInUrl)} target="_blank" rel="noreferrer"><Link size={14} /> LinkedIn</a>}{externalUrl(p.youtubeUrl) && <a href={externalUrl(p.youtubeUrl)} target="_blank" rel="noreferrer"><Video size={14} /> Media</a>}</div><button className="primary-button" onClick={onEngage}>Start engagement</button></div>
  </article>;
}

function EngagementCard({ record, saving, onEdit, onUpdate }: { record: MarketplaceRecord; saving: boolean; onEdit: () => void; onUpdate: (payload: Record<string, unknown>, status: string) => Promise<void> }) {
  const p = record.payload;
  const escrow = text(p.escrowStatus) || "Not funded";
  const next = escrow === "Not funded" ? { label: "Hold test funds", status: "Funded", escrow: "Held in test escrow" } : escrow === "Held in test escrow" && record.status === "Funded" ? { label: "Activate work", status: "Active", escrow } : null;
  return <article className="engagement-card">
    <div className="engagement-heading"><div><span>{record.reference}{p.simulatedData === true && <em className="simulated-badge">Simulated</em>}</span><h3>{record.title}</h3><p>{text(p.consultantName) || "Open brief"} · {text(p.client) || record.owner}</p></div><span className={`status-pill ${record.status === "Disputed" ? "red" : ""}`}><i />{record.status}</span></div>
    <p className="engagement-brief">{text(p.brief)}</p>
    <div className="engagement-facts"><div><span>Budget</span><strong>£{number(p.budget).toLocaleString("en-GB")}</strong></div><div><span>Agreed day rate</span><strong>£{number(p.agreedRate).toLocaleString("en-GB")}</strong></div><div><span>Milestone</span><strong>{text(p.milestone) || "Not set"}</strong></div><div><span>Test escrow</span><strong>{escrow}</strong></div></div>
    {(number(p.clientRating) || number(p.consultantRating)) > 0 && <div className="two-way-rating"><Star size={14} /><span>Client → consultant: <strong>{number(p.clientRating) || "Pending"}/5</strong></span><span>Consultant → client: <strong>{number(p.consultantRating) || "Pending"}/5</strong></span></div>}
    <div className="engagement-actions"><button className="secondary-button" onClick={onEdit}>Edit & rate</button>{next && <button className="primary-button" disabled={saving} onClick={() => void onUpdate({ ...p, escrowStatus: next.escrow }, next.status)}>{next.label}</button>}{record.status === "Active" && <button className="primary-button" onClick={onEdit}>Client sign-off</button>}{!["Completed", "Disputed"].includes(record.status) && <button className="danger-outline" disabled={saving} onClick={() => void onUpdate({ ...p, escrowStatus: "Disputed" }, "Disputed")}>Raise dispute</button>}</div>
  </article>;
}

function PostCard({ record, actorName, onUpdate }: { record: MarketplaceRecord; actorName: string; onUpdate: (payload: Record<string, unknown>) => Promise<void> }) {
  const [comment, setComment] = useState("");
  const p = record.payload;
  const comments = Array.isArray(p.comments) ? p.comments as Array<{ author: string; body: string; createdAt: string }> : [];
  const video = youtubeId(text(p.mediaUrl));
  return <article className="community-post">
    <div className="post-author"><div>{text(p.author).split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</div><span><strong>{text(p.author)}{p.simulatedData === true && <em className="simulated-badge">Simulated</em>}</strong><small>{text(p.postType)} · {text(p.topic)}</small></span></div>
    <h3>{text(p.headline)}</h3><p>{text(p.body)}</p>
    {video && <div className="youtube-embed"><iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video)}`} title={text(p.headline) || "YouTube media"} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen /></div>}
    {externalUrl(p.mediaUrl) && !video && <a className="media-link" href={externalUrl(p.mediaUrl)} target="_blank" rel="noreferrer"><Play size={14} /> Open linked media <ExternalLink size={12} /></a>}
    <div className="post-actions"><button onClick={() => void onUpdate({ ...p, reactions: number(p.reactions) + 1 })}><ThumbsUp size={14} /> Useful {number(p.reactions)}</button><span><MessageCircle size={14} /> {comments.length} comments</span></div>
    {comments.map((item, index) => <div className="post-comment" key={`${item.createdAt}-${index}`}><strong>{item.author}</strong><span>{item.body}</span></div>)}
    <form className="comment-form" onSubmit={(event) => { event.preventDefault(); if (!comment.trim()) return; void onUpdate({ ...p, comments: [...comments, { author: actorName, body: comment.trim(), createdAt: new Date().toISOString() }] }); setComment(""); }}><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a professional comment…" maxLength={500} /><button>Comment</button></form>
  </article>;
}

function MarketplaceEditor({ editor, actor, profiles, saving, onClose, onSave }: { editor: NonNullable<Editor>; actor: { displayName: string; email: string }; profiles: MarketplaceRecord[]; saving: boolean; onClose: () => void; onSave: (input: SaveInput) => Promise<void> }) {
  const existing = editor.record;
  const p = existing?.payload ?? {};
  const [form, setForm] = useState<Record<string, string>>(() => (editor.kind === "profile" ? {
    displayName: text(p.displayName) || actor.displayName, headline: text(p.headline), location: text(p.location), jurisdictions: list(p.jurisdictions).join(", "), specialisms: list(p.specialisms).join(", "), qualifications: list(p.qualifications).join(", "), memberships: list(p.memberships).join(", "), yearsExperience: String(number(p.yearsExperience) || ""), availability: text(p.availability) || "Available now", dailyRate: String(number(p.dailyRate) || ""), linkedInUrl: text(p.linkedInUrl), youtubeUrl: text(p.youtubeUrl), bio: text(p.bio),
  } : editor.kind === "post" ? {
    postType: text(p.postType) || "Update", headline: text(p.headline), topic: text(p.topic), body: text(p.body), mediaUrl: text(p.mediaUrl),
  } : {
    consultantId: text(p.consultantId) || editor.consultant?.id || "", consultantName: text(p.consultantName) || text(editor.consultant?.payload.displayName), client: text(p.client) || actor.displayName, brief: text(p.brief), budget: String(number(p.budget) || ""), agreedRate: String(number(p.agreedRate) || number(editor.consultant?.payload.dailyRate) || ""), milestone: text(p.milestone), completionEvidence: text(p.completionEvidence), clientRating: String(number(p.clientRating) || ""), consultantRating: String(number(p.consultantRating) || ""), status: existing?.status || "Proposed",
  }) as Record<string, string>);
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (editor.kind === "profile") {
      await onSave({ id: existing?.id, module: "marketplace", title: form.displayName, status: form.availability === "Unavailable" ? "Unavailable" : "Profile active", priority: "Low", owner: actor.displayName, dueDate: null, payload: { ...p, marketplaceType: "consultant", ownerEmail: actor.email, displayName: form.displayName, headline: form.headline, location: form.location, jurisdictions: list(form.jurisdictions), specialisms: list(form.specialisms), qualifications: list(form.qualifications), memberships: list(form.memberships), yearsExperience: Number(form.yearsExperience), availability: form.availability, dailyRate: Number(form.dailyRate), linkedInUrl: form.linkedInUrl, youtubeUrl: form.youtubeUrl, bio: form.bio, verified: Boolean(p.verified), rating: number(p.rating), reviewCount: number(p.reviewCount) } });
    } else if (editor.kind === "post") {
      await onSave({ id: existing?.id, module: "marketplace", title: form.headline || `${form.postType}: ${form.topic}`, status: "Published", priority: "Low", owner: actor.displayName, dueDate: null, payload: { ...p, marketplaceType: "post", author: actor.displayName, postType: form.postType, headline: form.headline, topic: form.topic, body: form.body, mediaUrl: form.mediaUrl, reactions: number(p.reactions), comments: p.comments ?? [] } });
    } else {
      const consultant = profiles.find((item) => item.id === form.consultantId);
      const status = form.status || "Proposed";
      const clientRating = Number(form.clientRating);
      await onSave({ id: existing?.id, module: "marketplace", title: existing?.title || `${form.client} — ${form.brief.slice(0, 50)}`, status, priority: status === "Disputed" ? "High" : "Medium", owner: actor.displayName, dueDate: null, payload: { ...p, marketplaceType: "engagement", consultantId: form.consultantId, consultantName: text(consultant?.payload.displayName) || form.consultantName, client: form.client, brief: form.brief, budget: Number(form.budget), agreedRate: Number(form.agreedRate), milestone: form.milestone, completionEvidence: form.completionEvidence, clientRating, consultantRating: Number(form.consultantRating), rating: clientRating, escrowStatus: text(p.escrowStatus) || "Not funded" } });
    }
  };
  return <div className="drawer-backdrop" role="presentation"><aside className="record-drawer marketplace-editor" role="dialog" aria-modal="true" aria-label={`${editor.kind} editor`}>
    <div className="drawer-header"><div><span className="eyebrow">MARKETPLACE</span><h2>{existing ? "Edit" : "Create"} {editor.kind}</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <form onSubmit={submit}>
      {editor.kind === "profile" && <>
        <EditorField label="Professional name" required value={form.displayName} onChange={(v) => set("displayName", v)} />
        <EditorField label="Professional headline" required value={form.headline} onChange={(v) => set("headline", v)} />
        <EditorField label="UK location" required value={form.location} onChange={(v) => set("location", v)} />
        <EditorField label="Jurisdiction expertise" hint="Comma-separated" required value={form.jurisdictions} onChange={(v) => set("jurisdictions", v)} />
        <EditorField label="Specialisms" hint="Comma-separated" required value={form.specialisms} onChange={(v) => set("specialisms", v)} />
        <EditorField label="Qualifications" hint="e.g. NEBOSH Diploma" required value={form.qualifications} onChange={(v) => set("qualifications", v)} />
        <EditorField label="Memberships" hint="NEBOSH / IOSH / OSHCR" value={form.memberships} onChange={(v) => set("memberships", v)} />
        <EditorField label="Years' experience" type="number" required value={form.yearsExperience} onChange={(v) => set("yearsExperience", v)} />
        <label>Availability<select value={form.availability} onChange={(e) => set("availability", e.target.value)}><option>Available now</option><option>Available this month</option><option>Unavailable</option></select></label>
        <EditorField label="Daily rate (£)" type="number" required value={form.dailyRate} onChange={(v) => set("dailyRate", v)} />
        <EditorField label="LinkedIn profile URL" type="url" value={form.linkedInUrl} onChange={(v) => set("linkedInUrl", v)} />
        <EditorField label="YouTube video / channel URL" type="url" value={form.youtubeUrl} onChange={(v) => set("youtubeUrl", v)} />
        <EditorField label="Professional biography" textarea required value={form.bio} onChange={(v) => set("bio", v)} />
        <div className="integration-note"><Link size={15} /><span><strong>LinkedIn OAuth is not active yet.</strong> The public profile URL is stored; OAuth publishing requires approved LinkedIn credentials.</span></div>
      </>}
      {editor.kind === "post" && <>
        <label>Content format<select value={form.postType} onChange={(e) => set("postType", e.target.value)}><option>Update</option><option>Article</option><option>Topic thread</option></select></label>
        <EditorField label="Headline" value={form.headline} onChange={(v) => set("headline", v)} />
        <EditorField label="Topic" required value={form.topic} onChange={(v) => set("topic", v)} />
        <EditorField label="Content" textarea required value={form.body} onChange={(v) => set("body", v)} />
        <EditorField label="YouTube or media URL" type="url" value={form.mediaUrl} onChange={(v) => set("mediaUrl", v)} />
      </>}
      {editor.kind === "engagement" && <>
        <label>Consultant<select value={form.consultantId} onChange={(e) => set("consultantId", e.target.value)}><option value="">Open brief / not selected</option>{profiles.map((profile) => <option value={profile.id} key={profile.id}>{text(profile.payload.displayName)}</option>)}</select></label>
        <EditorField label="Client / organisation" required value={form.client} onChange={(v) => set("client", v)} />
        <EditorField label="Project brief" textarea required value={form.brief} onChange={(v) => set("brief", v)} />
        <EditorField label="Agreed budget (£)" type="number" required value={form.budget} onChange={(v) => set("budget", v)} />
        <EditorField label="Agreed day rate (£)" type="number" required value={form.agreedRate} onChange={(v) => set("agreedRate", v)} />
        <EditorField label="Current milestone" value={form.milestone} onChange={(v) => set("milestone", v)} />
        <EditorField label="Completion / sign-off evidence" textarea value={form.completionEvidence} onChange={(v) => set("completionEvidence", v)} />
        <EditorField label="Client rates consultant (1–5)" type="number" value={form.clientRating} onChange={(v) => set("clientRating", v)} />
        <EditorField label="Consultant rates client (1–5)" type="number" value={form.consultantRating} onChange={(v) => set("consultantRating", v)} />
        <label>Workflow status<select value={form.status} onChange={(e) => set("status", e.target.value)}><option>Proposed</option><option>Negotiating</option><option>Funded</option><option>Active</option><option>Completed</option><option>Disputed</option></select></label>
        <div className="integration-note warning"><CircleAlert size={15} /><span><strong>No money is moved.</strong> “Escrow” states are a test workflow until a regulated payment provider and dispute policy are configured.</span></div>
      </>}
      <div className="editor-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving…" : "Save"}</button></div>
    </form>
  </aside></div>;
}

function EditorField({ label, hint, value, onChange, type = "text", required = false, textarea = false }: { label: string; hint?: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; textarea?: boolean }) {
  return <label>{label}{hint && <em>{hint}</em>}{textarea ? <textarea required={required} value={value} onChange={(e) => onChange(e.target.value)} rows={5} /> : <input type={type} min={type === "number" ? "0" : undefined} max={label.includes("1–5") ? "5" : undefined} required={required} value={value} onChange={(e) => onChange(e.target.value)} />}</label>;
}

function MarketplaceEmpty({ icon, title, text: body, action }: { icon: React.ReactNode; title: string; text: string; action: React.ReactNode }) {
  return <div className="marketplace-empty"><span>{icon}</span><h2>{title}</h2><p>{body}</p>{action}</div>;
}
