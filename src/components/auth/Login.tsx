import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';
import CustomInputComponent from '../InputComponent';
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BasicForm = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (values: any, { setSubmitting, setErrors }) => {
    try {
      // 1. Effectuer la requête de connexion avec l'email et le mot de passe
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      console.log(data);
  
      if (response.ok && data.token) {
        // 2. Si la connexion est réussie, obtenir le token
        const token = data.token;
        
        // 3. Vérifier les utilisateurs via la route GET /users
        const userResponse = await fetch('http://localhost:3000/users', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Passer le token pour vérifier l'utilisateur
          },
        });
        const usersData = await userResponse.json();
        
        if (userResponse.ok) {
          // 4. Chercher l'utilisateur en utilisant l'email et le mot de passe
          const currentUser = usersData.find((user: any) => 
            user.email === values.email
        );
        
        console.log(currentUser)
        
        if (currentUser) {
            // 5. Stocker l'`userId` dans le localStorage
            login(token, currentUser.id);  // Connecter l'utilisateur avec le token
            navigate('/game', { state: { message: 'Vous êtes connecté' } });
          } else {
            setErrorMessage('Utilisateur ou mot de passe incorrect');
          }
        } else {
          setErrorMessage('Impossible de récupérer les utilisateurs.');
        }
      } else {
        setErrorMessage(data.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      setErrorMessage('Erreur réseau. Veuillez réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center sm:py-12">
      <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-md">
        <h1 className="font-bold text-center text-2xl mb-5">Connexion</h1>  
        <div className="bg-base-200 shadow w-full rounded-lg divide-y divide-gray-200">
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={Yup.object({
              email: Yup.string().email('Adresse e-mail invalide').required('Champ requis'),
              password: Yup.string().required('Champ requis'),
            })}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="px-5 py-7">
                <Field name="email" label="E-mail" component={CustomInputComponent} />
                <Field name="password" type="password" label="Mot de passe" component={CustomInputComponent} />

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="btn btn-primary w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block"
                >
                  <span className="inline-block mr-2">Je me connecte</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Form>
            )}
          </Formik>
          
          {/* Boutons additionnels et Liens */}
          <div className="py-5">
            <div className="grid grid-cols-2 gap-1">
              <div className="text-center sm:text-left whitespace-nowrap">
                <button
                  type="button"
                  className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg hover:bg-base-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-4 h-4 inline-block align-text-top"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="inline-block ml-1">Mot de passe oublié ?</span>
                </button>
              </div>
              <div className="text-center sm:text-right whitespace-nowrap">
                <button
                  type="button"
                  className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg hover:bg-base-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-4 h-4 inline-block align-text-bottom"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="inline-block ml-1">Aide</span>
                </button>
              </div>
              <div className="text-center sm:text-right whitespace-nowrap">
                <Link to="/login">
                  <button
                    type="button"
                    className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg hover:bg-base-100 focus:outline-none focus:bg-base-200 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      className="w-4 h-4 inline-block align-text-bottom">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2"
                        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" 
                      />
                    </svg>
                    <span className='inline-block ml-1'>Pas de compte ? Je m'inscris</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicForm;
