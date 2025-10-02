import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="pt-BR">
        <Head>
          <meta charSet="utf-8" />
          
          {/* Favicons - usando rota API para evitar loops */}
          <link rel="icon" href="/api/favicon" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
          
          {/* Tema */}
          <meta name="theme-color" media="(prefers-color-scheme: light)" content="white" />
          <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#171717" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument; 