import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="pt-BR">
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          
          {/* Favicons - adicionando todas as variantes necessárias */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
          <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="shortcut icon" href="/favicon.ico" />
          
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