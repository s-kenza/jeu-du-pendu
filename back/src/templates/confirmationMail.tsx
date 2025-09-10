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
import Github from '../assets/github.png';
import Linkedin from '../assets/linkedin.png';

interface ConfirmEmailProps {
  validationCode?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '';

export const ConfirmEmail = ({
  validationCode,
}: ConfirmEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>Confirmez votre adresse mail</Preview>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src={`${baseUrl}/static/slack-logo.png`}
            width="120"
            height="36"
            alt="Slack"
          />
        </Section>
        <Heading style={h1}>Votre lien magique</Heading>
        <Text style={heroText}>
          Pour confirmer votre inscription, cliquez sur le lien ci-dessous - vous serez redirigé sur Jeu de Kenza afin de vous y connecter.
        </Text>

        <Section style={codeBox}>
          <Text style={confirmationCodeText}>{validationCode}</Text>
        </Section>

        <Text style={text}>
          Si vous n'avez pas demandé à recevoir ce mail, ne vous inquiétez pas, vous pouvez
          l'ignorer en toute sécurité.
        </Text>

        <Section>
          <Row style={footerLogos}>
            <Column style={{ width: '66%' }}>
              <Img
                src={`${baseUrl}/static/slack-logo.png`}
                width="120"
                height="36"
                alt="Slack"
              />
            </Column>
            <Column align="right">
              <Link href="https://github.com/s-kenza">
                <Img
                  src={Github}
                  width="32"
                  height="32"
                  alt="Profil Github Kenza SCHULER"
                  style={socialMediaIcon}
                />
              </Link>
              <Link href="https://www.linkedin.com/in/kenza-schuler-9aa4ab231/">
                <Img
                  src={Linkedin}
                  width="32"
                  height="32"
                  alt="Profil LinkedIn Kenza SCHULER"
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

ConfirmEmail.PreviewProps = {
  validationCode: 'DJZ-TLX',
} as ConfirmEmailProps;

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
  backgroundColor: '#ffffff',
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
  background: 'rgb(245, 244, 245)',
  borderRadius: '4px',
  marginBottom: '30px',
  padding: '40px 10px',
};

const confirmationCodeText = {
  fontSize: '30px',
  textAlign: 'center' as const,
  verticalAlign: 'middle',
};

const text = {
  color: '#000',
  fontSize: '14px',
  lineHeight: '24px',
};