// api/gas.js
// Proxy serverless (Vercel) entre o front-end (relprev-lsg-gig.html) e o backend
// no Google Apps Script. O front-end nunca fala diretamente com o GAS — ele fala
// só com /api/gas, que roda no servidor da Vercel e repassa a chamada.
// Isso resolve dois problemas de uma vez:
//  1. Bloqueio de acesso direto a script.google.com na rede da empresa.
//  2. CORS: como o front-end chama a mesma origem (/api/gas), não há CORS a configurar.

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxnCdVpNI_4CpNzY8aMY2cSbZZ5XVDIPQYlfl2vnD6rGGWnl_wVjtqF3ej96BZmoCZN/exec';

export default async function handler(req, res) {
  try {
    let gasResponse;

    if (req.method === 'GET') {
      // Ex.: /api/gas?action=get_status&protocolo=RELPREV-GIG-...
      const params = new URLSearchParams(req.query).toString();
      gasResponse = await fetch(`${GAS_URL}?${params}`, { method: 'GET' });

    } else if (req.method === 'POST') {
      // req.body já vem parseado como objeto pela Vercel quando o content-type é JSON
      gasResponse = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // o GAS só precisa do texto bruto em e.postData.contents
        body: JSON.stringify(req.body)
      });

    } else {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    const text = await gasResponse.text();
    let data;
    try { data = JSON.parse(text); }
    catch { data = { error: 'Resposta inesperada do backend', raw: text }; }

    res.status(200).json(data);

  } catch (err) {
    res.status(502).json({ error: 'Falha ao comunicar com o backend do RELPREV', details: err.message });
  }
}
