export function promoErrorPage(code: number, headline: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>PHANTOM GRID // ${code}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&display=swap');
    body {
      background: #0E0E0E;
      color: #DCDCDC;
      font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;
      text-align: center;
      margin: 0;
    }
    .eyebrow {
      font-size: 0.65rem;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: #D6524C;
      text-shadow: 0 0 0.625rem rgba(214, 82, 76, 0.5);
    }
    .headline {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin: 0;
    }
    .msg {
      font-size: 0.75rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(220, 220, 220, 0.4);
    }
    .back {
      font-size: 0.65rem;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: rgba(220, 220, 220, 0.4);
      text-decoration: none;
      margin-top: 1.5rem;
      border-bottom: 0.0625rem solid rgba(220,220,220,0.2);
      padding-bottom: 0.2rem;
    }
  </style>
</head>
<body>
  <span class="eyebrow">// PHANTOM GRID</span>
  <h1 class="headline">${headline}</h1>
  <p class="msg">${message}</p>
  <a href="/" class="back">← RETURN TO GRID</a>
</body>
</html>`;
}
