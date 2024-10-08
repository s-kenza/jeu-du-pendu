import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';
import CustomInputComponent from '../InputComponent';
import { Link } from 'react-router-dom';

/* Faire layout de register et login */
/* Ouverture de la navbar : bug du menu qui ne se ferme pas */

const BasicForm = () => (
  <div className="min-h-screen flex flex-col justify-center sm:py-12">
    <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-md">
      <h1 className="font-bold text-center text-2xl mb-5">Inscription au jeu</h1>
      <div className="bg-base-200 shadow w-full rounded-lg divide-y divide-gray-200">
        <Formik
          initialValues={{ email: '', password: '', confirmPassword: '', name: '', surname: '', username: '' }}
          validationSchema={Yup.object({
            email: Yup.string().email('Adresse e-mail invalide').required('Champ requis'),
            password: Yup.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').required('Champ requis'),
            confirmPassword: Yup.string()
              .oneOf([Yup.ref('password'), null], 'Les mots de passe ne correspondent pas')
              .required('Champ requis'),
            name: Yup.string().required('Champ requis'),
            surname: Yup.string().required('Champ requis'),
            username: Yup.string().required('Champ requis'),
          })}
          onSubmit={(values, { setSubmitting }) => {
            setTimeout(() => {
              console.log('Inscrit : ', values);
              setSubmitting(false);
            }, 400);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="px-5 py-7">
              <Field name="name" label="Nom" component={CustomInputComponent} />
              <Field name="surname" label="Prénom" component={CustomInputComponent} />
              <Field name="username" label="Nom d'utilisateur" component={CustomInputComponent} />
              <Field name="email" label="E-mail" component={CustomInputComponent} />
              <Field name="password" type="password" label="Mot de passe" component={CustomInputComponent} />
              <Field name="confirmPassword" type="password" label="Confirmez le mot de passe" component={CustomInputComponent} />

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block"
              >
                <span className="inline-block mr-2">Je m'inscris</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline-block">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </Form>
          )}
        </Formik>


        <div className="py-5">
          <div className="grid grid-cols-2 gap-1">
            <div className="text-center sm:text-left whitespace-nowrap">
              <button
                type="button"
                className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-base-100 focus:outline-none focus:bg-base-200 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset"
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
                className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-base-100 focus:outline-none focus:bg-base-200 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset"
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
                className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-base-100 focus:outline-none focus:bg-base-200 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset"
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
                  <span className='inline-block inline-block ml-1'>Déjà inscrit ? Je me connecte</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default BasicForm;
