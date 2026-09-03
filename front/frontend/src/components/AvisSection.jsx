import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { avisAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const NOTES = [1, 2, 3, 4, 5];

function ilYA(date) {
  const jours = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return "hier";
  if (jours < 30) return `il y a ${jours} jours`;
  if (jours < 365) return `il y a ${Math.floor(jours / 30)} mois`;
  const ans = Math.floor(jours / 365);
  return `il y a ${ans} an${ans > 1 ? "s" : ""}`;
}

/**
 * Avis des lecteurs. Registre de repérage, jamais `.voix` : la voix est
 * réservée à Wendy (DA, section 5).
 * La note s'écrit en chiffres — une rangée d'étoiles serait un pictogramme
 * décoratif de plus, et le jaune n'existe pas dans la palette.
 */
export default function AvisSection({ cafeId }) {
  const { connecte } = useAuth();

  const [avis, setAvis] = useState([]);
  const [moyenne, setMoyenne] = useState(null);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [monAvis, setMonAvis] = useState(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState(null);

  const charger = useCallback(() => {
    setChargement(true);
    avisAPI.getByCafe(cafeId)
      .then((reponse) => {
        setAvis(reponse.donnees);
        setMoyenne(reponse.moyenne);
        setTotal(reponse.total);
        setErreur(null);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [cafeId]);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    if (!connecte) { setMonAvis(null); return; }
    avisAPI.getMine(cafeId)
      .then((mien) => {
        setMonAvis(mien);
        if (mien) { setNote(mien.note); setCommentaire(mien.commentaire ?? ""); }
      })
      .catch(() => setMonAvis(null));
  }, [cafeId, connecte]);

  const envoyer = async (e) => {
    e.preventDefault();
    if (note === 0) { setErreurEnvoi("choisir une note de 1 à 5."); return; }
    setEnvoiEnCours(true);
    setErreurEnvoi(null);
    try {
      const enregistre = await avisAPI.save(cafeId, { note, commentaire });
      setMonAvis(enregistre);
      setFormulaireOuvert(false);
      charger();
    } catch (err) {
      setErreurEnvoi(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const supprimer = async () => {
    if (!window.confirm("supprimer votre avis ?")) return;
    try {
      await avisAPI.delete(cafeId);
      setMonAvis(null);
      setNote(0);
      setCommentaire("");
      charger();
    } catch (err) {
      setErreurEnvoi(err.message);
    }
  };

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-section text-encre">Avis des lecteurs</h2>
        {moyenne !== null && (
          <p className="text-meta text-gris">
            {String(moyenne).replace(".", ",")} sur 5, {total} avis
          </p>
        )}
      </div>

      {connecte ? (
        <div className="mb-8">
          {formulaireOuvert ? (
            <form onSubmit={envoyer} className="border border-trait rounded-carte p-5">
              <fieldset>
                <legend className="mb-3 text-meta text-gris">Votre Note</legend>
                <div className="flex gap-2">
                  {NOTES.map((valeur) => (
                    <button
                      key={valeur}
                      type="button"
                      aria-pressed={note === valeur}
                      onClick={() => setNote(valeur)}
                      className={`flex w-11 items-center justify-center ${
                        note === valeur ? "bg-plaque text-white" : "border border-trait-fort text-encre"
                      }`}
                    >
                      {valeur}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="mt-5 block">
                <span className="mb-2 block text-meta text-gris">Votre Commentaire</span>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="w-full border border-trait-fort rounded-carte bg-carte p-3 text-corps text-encre"
                />
              </label>

              {erreurEnvoi && <p className="mt-3 text-meta text-rouge">{erreurEnvoi}</p>}

              <div className="mt-4 flex flex-wrap gap-3">
                <button type="submit" disabled={envoiEnCours} className="bouton">
                  {envoiEnCours ? "envoi…" : "publier"}
                </button>
                <button type="button" onClick={() => setFormulaireOuvert(false)} className="bouton-secondaire">
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setFormulaireOuvert(true)} className="bouton-secondaire">
                {monAvis ? "modifier mon avis" : "donner mon avis"}
              </button>
              {monAvis && (
                <button type="button" onClick={supprimer} className="flex items-center px-4 text-meta text-rouge">
                  Supprimer Mon Avis
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="mb-8 text-meta text-gris">
          <Link to="/login" className="underline underline-offset-4">Se Connecter</Link> Pour Donner Son Avis.
        </p>
      )}

      {chargement ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }, (_, i) => <div key={i} className="squelette h-20 w-full" />)}
        </div>
      ) : erreur ? (
        <p className="mesure text-corps text-encre">{erreur} les avis reviennent en rafraîchissant la page.</p>
      ) : avis.length === 0 ? (
        <p className="mesure text-corps text-encre">
          personne n&apos;a encore donné son avis sur cette adresse. la première impression est à prendre.
        </p>
      ) : (
        <ul className="flex flex-col">
          {avis.map((entree) => (
            <li key={entree.id} className="border-t border-trait py-5">
              <div className="flex flex-wrap items-baseline gap-x-4">
                <p className="text-encre">{entree.username}</p>
                <p className="text-meta text-gris">{entree.note} sur 5</p>
                <p className="text-meta text-gris">{ilYA(entree.created_at)}</p>
              </div>
              {entree.commentaire && <p className="mesure mt-2 text-corps text-encre">{entree.commentaire}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
