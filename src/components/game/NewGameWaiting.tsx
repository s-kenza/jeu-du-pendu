import { useEffect, useState } from "react";

const NewGameWaiting = ({ isLoading, playersReady, setPlayersReady  }) => {
    
    // useEffect(() => {
    //     if (playersReady.length === 2) {
    //         // Quand les 2 joueurs sont prêts, réinitialise playersReady dans l'enfant
    //         setPlayersReady([]);  // Réinitialisation du tableau
    //     }
    // }, [playersReady, setPlayersReady]); // Écoute les changements de playersReady
    
    return (
        <div>
            {isLoading ? (
                <div>
                    <h1>Waiting for other player to join...</h1>
                    <p>Loading...</p>
                </div>
            ) : (
                null
            )}
        </div>
    );
};

export default NewGameWaiting;
