export async function translateText(language: string, text: string): Promise<any> {
  const response = await fetch('https://tongues.directto.link/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ language, text })
  });

  return await response.json();
}

export async function getLanguage(text: string): Promise<any> {
  const response = await fetch('https://tongues.directto.link/language', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  return await response.json();
}

