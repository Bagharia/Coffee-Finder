import { useState, useEffect } from "react";
import { avisAPI, usersAPI } from "../services/api";

function Stars({ value, onChange, size = "md" }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "lg" ? "w-8 h-8" : "w-5 h-5";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`transition-transform ${onChange ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <svg viewBox="0 0 24 24" className={sz} fill={(hovered || value) >= star ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 30) return `Il y a ${days} jours`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  return `Il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

export default function AvisSection({ cafeId }) {
  const isAuth = usersAPI.isAuthenticated();
  const [data, setData] = useState({ avis: [], moyenne: null, total: 0 });
  const [myAvis, setMyAvis] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    avisAPI.getByCafe(cafeId).then(setData).catch(() => {}).finally(() => setLoading(false));
    if (isAuth) avisAPI.getMine(cafeId).then(a => {
      setMyAvis(a);
      if (a) { setNote(a.note); setCommentaire(a.commentaire || ""); }
    }).catch(() => {});
  };

  useEffect(() => { load(); }, [cafeId, isAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (note === 0) return;
    setSubmitting(true);
    try {
      await avisAPI.save(cafeId, { note, commentaire });
      setShowForm(false);
      load();
    } catch {}
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer votre avis ?")) return;
    await avisAPI.delete(cafeId);
    setMyAvis(null);
    setNote(0);
    setCommentaire("");
    load();
  };

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-(--text-primary)">Avis</h2>
          {data.moyenne && (
            <div className="flex items-center gap-2 mt-1">
              <Stars value={Math.round(data.moyenne)} size="md" />
              <span className="font-bold text-(--text-primary)">{data.moyenne}</span>
              <span className="text-(--text-muted) text-sm">({data.total} avis)</span>
            </div>
          )}
        </div>
        {isAuth && !myAvis && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-(--accent) text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-(--accent-light) transition-all btn-press"
          >
            Donner mon avis
          </button>
        )}
      </div>

      {/* Mon avis existant */}
      {myAvis && !showForm && (
        <div className="bg-[rgba(107,143,94,0.08)] border border-[rgba(107,143,94,0.25)] rounded-2xl p-5 mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-(--accent) uppercase tracking-wider mb-1">Mon avis</p>
              <Stars value={myAvis.note} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(true)} className="text-xs text-(--text-muted) hover:text-(--accent) transition-colors font-medium">Modifier</button>
              <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium">Supprimer</button>
            </div>
          </div>
          {myAvis.commentaire && <p className="text-(--text-secondary) text-sm mt-3 leading-relaxed">{myAvis.commentaire}</p>}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-(--border) rounded-2xl p-5 mb-6">
          <p className="font-semibold text-(--text-primary) mb-4">{myAvis ? "Modifier mon avis" : "Laisser un avis"}</p>
          <div className="mb-4">
            <p className="text-sm text-(--text-muted) mb-2">Note</p>
            <Stars value={note} onChange={setNote} size="lg" />
          </div>
          <div className="mb-4">
            <p className="text-sm text-(--text-muted) mb-2">Commentaire <span className="text-(--text-muted) font-normal">(optionnel)</span></p>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              placeholder="Partagez votre expérience..."
              className="input-form w-full px-4 py-3 rounded-xl outline-none resize-none text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={note === 0 || submitting}
              className="bg-(--accent) text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-(--accent-light) transition-all disabled:opacity-50 btn-press">
              {submitting ? "Envoi..." : "Publier"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="border border-(--border) text-(--text-secondary) px-6 py-2.5 rounded-xl font-medium text-sm hover:border-(--accent) transition-all">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Invite à se connecter */}
      {!isAuth && (
        <div className="bg-(--bg-section) border border-(--border) rounded-2xl p-5 mb-6 text-center">
          <p className="text-(--text-secondary) text-sm mb-3">Connectez-vous pour laisser un avis</p>
          <a href="/login" className="bg-(--accent) text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-(--accent-light) transition-all">
            Se connecter
          </a>
        </div>
      )}

      {/* Liste des avis */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : data.avis.length === 0 ? (
        <div className="text-center py-10 text-(--text-muted)">
          <p className="text-3xl mb-3">☕</p>
          <p className="text-sm">Pas encore d'avis — soyez le premier !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.avis.map((avis) => (
            <div key={avis.id} className="bg-white border border-(--border) rounded-2xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-(--bg-section) flex items-center justify-center text-sm font-bold text-(--accent)">
                    {avis.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-(--text-primary) text-sm">{avis.username}</p>
                    <p className="text-(--text-muted) text-xs">{timeAgo(avis.created_at)}</p>
                  </div>
                </div>
                <Stars value={avis.note} />
              </div>
              {avis.commentaire && (
                <p className="text-(--text-secondary) text-sm leading-relaxed mt-3 pl-11">{avis.commentaire}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
