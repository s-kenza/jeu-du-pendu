import { useState } from "react";


const PrivacyPolicy = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    let style;

    if (theme == "dark") {
        style = { color: "black" };
    } else {
        style = {};
    }

    return (
        <div className="flex justify-center items-center min-h-screen p-4">
            <div className="max-w-3xl w-full bg-white shadow-xl rounded-xl p-6 space-y-4">
                <h1 className="text-3xl font-bold text-primary text-center">Politique de Confidentialité</h1>
                <p className="text-gray-600 text-center">Dernière mise à jour : 31/01/2025</p>

                <div className="space-y-4">
                    <section>
                        <h2 className="text-xl font-semibold text-secondary text-left">1. Informations stockées</h2>
                        <p style={style}>Le Jeu de Kenza ne collecte ni n’utilise de cookies. Cependant, certaines données sont stockées localement sur votre appareil :</p>
                        <ul style={style} className="list-disc list-inside mt-2">
                            <li>Jeton d’authentification (JWT) – Pour gérer votre connexion.</li>
                            <li>Identifiant utilisateur et nom d’utilisateur.</li>
                            <li>Préférences de jeu : thème (clair/sombre).</li>
                        </ul>
                        <p style={style} className="mt-2">Ces informations restent stockées sur votre appareil et ne sont jamais partagées avec des tiers.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-secondary text-left">2. Données stockées sur notre serveur</h2>
                        <p style={style}>Nous stockons sur notre serveur :</p>
                        <ul style={style} className="list-disc list-inside mt-2">
                            <li>Votre compte utilisateur (nom d’utilisateur, identifiant).</li>
                            <li>L’historique de vos parties.</li>
                        </ul>
                        <p style={style} className="mt-2">Ces informations restent confidentielles et ne sont pas partagées avec des tiers.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-secondary text-left">3. Suppression des données</h2>
                        <p style={style}>Actuellement, il n’existe pas encore d’option pour supprimer un compte ou réinitialiser les données. Cette fonctionnalité sera ajoutée prochainement.</p>
                        <p style={style}>Vous pouvez cependant nous contacter pour toute demande de suppression :</p>
                        <p className="mt-2 font-semibold text-primary">📧 <a href="mailto:kenza.schuler@gmail.com" className="underline">kenza.schuler@gmail.com</a></p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-secondary text-left">4. Sécurité</h2>
                        <p style={style}>Nous protégeons vos données contre tout accès non autorisé. Cependant, nous vous recommandons d’utiliser un mot de passe sécurisé pour votre compte.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-secondary text-left">5. Modifications</h2>
                        <p style={style}>Cette politique pourra être mise à jour. Nous vous informerons de tout changement important.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-secondary text-left">6. Contact</h2>
                        <p style={style}>Si vous avez des questions, contactez-nous :</p>
                        <p className="mt-2 font-semibold text-primary">📧 <a href="mailto:kenza.schuler@gmail.com" className="underline">kenza.schuler@gmail.com</a></p>
                    </section>
                </div>

            </div>
        </div>
    )
}
export default PrivacyPolicy;