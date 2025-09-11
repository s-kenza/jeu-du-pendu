import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';

const baseUrl = '';

export const ConfirmEmail = ({ verifiedToken }) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>Confirmez votre adresse mail</Preview>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src='https://github.com/s-kenza/portfolio/blob/main/public/K.png?raw=true'
            width="50"
            height="50"
            alt="Logo Kenza SCHULER"
          />
        </Section>
        <Heading style={h1}>🪄 Jeu du pendu</Heading>
        <Container>
          <Text style={heroText}>
            Pour confirmer votre inscription, cliquez sur le lien ci-dessous.
        </Text>
        </Container>

        <Link href="https://jeu-de-kenza.vercel.app/verify/{{TOKEN}}">
          <Section style={codeBox}>
            <Text style={confirmationCodeText}>👉 Cliquez ici pour vous inscrire 👈</Text>
          </Section>
        </Link>

        <Text style={text}>
          Si vous n'avez pas demandé à recevoir ce mail, ne vous inquiétez pas, vous pouvez
          l'ignorer en toute sécurité.
        </Text>

        <Section>
          <Row style={footerLogos}>
            <Column style={{ width: '66%' }}>
              <Img
                src='https://github.com/s-kenza/portfolio/blob/main/public/K.png?raw=true'
                width="50"
                height="50"
                alt="Logo Kenza SCHULER"
              />
            </Column>
            <Column align="right">
              <Link href="https://github.com/s-kenza">
                <Img
                  src='https://cdn.simpleicons.org/github/000000'
                  width="32"
                  height="32"
                  alt="Profil Github Kenza SCHULER"
                  style={socialMediaIcon}
                />
              </Link>
              <Link href="https://www.linkedin.com/in/kenza-schuler-9aa4ab231/">
                <Img
                  src='https://img.icons8.com/?size=100&id=xuvGCOXi8Wyg&format=png&color=000000'
                  width="32"
                  height="32"
                  alt="Profil Linkedin Kenza SCHULER"
                  style={socialMediaIcon}
                />
              </Link>
            </Column>
          </Row>
        </Section>

        <Section>
          <Text style={footerText}>
            ©2025 Kenza Schuler, développeuse web. <br />
            <br />
            Tous droits réservés.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ConfirmEmail;

const footerText = {
  fontSize: '12px',
  color: '#b7b7b7',
  lineHeight: '15px',
  textAlign: 'left' as const,
  marginBottom: '50px',
};

const footerLink = {
  color: '#b7b7b7',
  textDecoration: 'underline',
};

const footerLogos = {
  marginBottom: '32px',
  paddingLeft: '8px',
  paddingRight: '8px',
};

const socialMediaIcon = {
  display: 'inline',
  marginLeft: '8px',
};

const main = {
  backgroundImage: 'linear-gradient(15deg,rgba(255, 255, 255, 1) 35%, rgba(133, 179, 255, 1) 60%, rgba(193, 157, 255, 1) 85%)',
  margin: '0 auto',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: '0 auto',
  padding: '0px 20px',
};


const logoContainer = {
  marginTop: '32px',
};

const h1 = {
  color: '#1d1c1d',
  fontSize: '36px',
  fontWeight: '700',
  margin: '30px 0',
  padding: '0',
  lineHeight: '42px',
};

const heroText = {
  fontSize: '20px',
  lineHeight: '28px',
  marginBottom: '30px',
};

const codeBox = {
  background: '#fdcae3ff',
  borderRadius: '4px',
  marginBottom: '30px',
  padding: '40px 10px',
  boxShadow: 'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
  display: 'flex',
  justifyContent: 'center',
};

const confirmationCodeText = {
  fontSize: '30px',
  textAlign: 'center' as const,
  verticalAlign: 'middle',
  color: '#000'
};

const text = {
  color: '#000',
  fontSize: '14px',
  lineHeight: '24px',
};