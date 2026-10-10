import { Component } from "react";

/**
 * Dernier filet côté écran : une erreur de rendu laisse sinon une page blanche,
 * sans un mot ni un lien pour en sortir.
 *
 * Il faut une classe — React n'offre pas d'équivalent en fonction. `cle`
 * (l'adresse de la page) la réarme à chaque navigation : sans ça, une page en
 * erreur le resterait pour tout le reste de la visite.
 */
export default class ErreurGlobale extends Component {
  state = { erreur: null };

  static getDerivedStateFromError(erreur) {
    return { erreur };
  }

  componentDidCatch(erreur, info) {
    console.error("[écran] erreur de rendu :", erreur, info.componentStack);
  }

  componentDidUpdate(precedentes) {
    if (this.state.erreur && precedentes.cle !== this.props.cle) {
      this.setState({ erreur: null });
    }
  }

  render() {
    if (!this.state.erreur) return this.props.children;

    return (
      <div className="mx-auto max-w-3xl px-6 py-16" role="alert">
        <h1 className="text-titre text-encre">quelque chose s&apos;est mal passé</h1>
        <p className="mesure mt-6 text-corps text-encre">
          cette page n&apos;a pas pu s&apos;afficher. recharger la page suffit
          souvent ; sinon, revenir au guide.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={() => window.location.reload()} className="bouton">
            recharger la page
          </button>
          <a href="/cafes" className="bouton-secondaire">parcourir le guide</a>
        </div>
      </div>
    );
  }
}
