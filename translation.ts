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

export async function getLanguage(html: string): Promise<any> {
  const response = await fetch('https://tongues.directto.link/language', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ html })
  });

  return await response.json();
}

