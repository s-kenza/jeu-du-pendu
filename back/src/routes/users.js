import {
	getUserById,
	getUsers,
	loginUser,
	registerUser,
	verifyUser,
} from "../controllers/users.js";
export function usersRoutes(app) {
	app.post("/login", async (request, reply) => {
		try {
			const response = await loginUser(request.body, app);
			if (response.error) {
			  // On spécifie un code d'erreur 400 pour les erreurs de validation
			  reply.status(400).send(response);
			} else {
			  reply.send(response);
			}
		  } catch (error) {
			console.error("Login error:", error); // Pour voir l'erreur dans les logs
			reply.status(500).send({ error: "Erreur interne du serveur" });
		  }
	}).post(
		"/logout",
		{ preHandler: [app.authenticate] },
		async (request, reply) => {
			const token = request.headers["authorization"].split(" ")[1]; // Récupérer le token depuis l'en-tête Authorization

			// Ajouter le token à la liste noire
			blacklistedTokens.push(token);

			reply.send({ logout: true });
		}
	);
	//inscription
	app.post("/register", async (request, reply) => {
		try {
		  const response = await registerUser(request.body, app.bcrypt);
		  if (response.error) {
			// On renvoie un code 400 pour les erreurs de validation
			reply.status(400).send(response);
		  } else {
			reply.send(response);
		  }
		} catch (error) {
		  console.error("Register error:", error);
		  reply.status(500).send({ 
			error: "Une erreur est survenue lors de l'inscription. Veuillez réessayer." 
		  });
		}
	  });
	//récupération de la liste des utilisateurs
	app.get("/users", async (request, reply) => {
		reply.send(await getUsers());
	});
	//récupération d'un utilisateur par son id
	app.get("/users/:id", async (request, reply) => {
		reply.send(await getUserById(request.params.id));
	});

	// Vérification de l'email de l'utilisateur via le token
	app.get("/verify/:token", async (request, reply) => {
		const response = await verifyUser(request.params.token);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});
}
