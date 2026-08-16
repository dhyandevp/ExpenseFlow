import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  try {
    const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0BleHBlbnNlZmxvdy1leHBlbnN0cmFja2VyLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwic3ViIjoiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAZXhwZW5zZWZsb3ctZXhwZW5zdHJhY2tlci5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsImF1ZCI6Imh0dHBzOi8vaWRlbnRpdHl0b29sa2l0Lmdvb2dsZWFwaXMuY29tL2dvb2dsZS5pZGVudGl0eS5pZGVudGl0eXRvb2xraXQudjEuSWRlbnRpdHlUb29sa2l0IiwiaWF0IjoxNzg2ODc4NjUyLCJleHAiOjE3ODY4ODIyNTIsInVpZCI6Imd1ZXN0XzUyNzhhZDk4ZDM1MjRhNjZhZGI1NmMyYjVmMGEzZjM2IiwiY2xhaW1zIjp7Imd1ZXN0R3JvdXBJZCI6IlBXVEVTVCIsIm1vZGUiOiJndWVzdCJ9fQ.ERbaIFGoaoxGhFKk0BrWwqt_seuIHOlkhxN94Px2FscsTyo1_plX6qiQ3le8OwKKaNs4MM6esP5aEB_2PWv6i-6iX5FtjeOKVVSUQJYct7YRvOwpfq1_9KC1Tr0DxzrPcwk9kQH6WTJaSBHu2ZtahmLxwvhbv5lzEOGtk7AyizcwgIErvtrE7ZxnntXBN6r0UlkB4iV6oXSiocoSYOW9AbvqzcU_XelzauqdmrcIidS62d2gOHNLl-MMxp5irsLykKGC7ZYKt0NMlNtwwNyJwcEI_-0O9h4CctbSQLDu2SBfuf05zAbR1tzp14JRBrLuvfUF1muVLwoWnYhiuH74uQ";
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'https://expenseflow.site',
        'Referer': 'https://expenseflow.site/'
      },
      body: JSON.stringify({ token, returnSecureToken: true })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
run();
