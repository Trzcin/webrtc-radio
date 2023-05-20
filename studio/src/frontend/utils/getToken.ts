export async function getToken(client_id: string, client_secret: string) {
  const bodyJSON = {
    grant_type: 'client_credentials',
    client_id,
    client_secret,
  };
  const formBody = Object.keys(bodyJSON)
    .map(
      (key) => encodeURIComponent(key) + '=' + encodeURIComponent(bodyJSON[key])
    )
    .join('&');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: formBody,
  });
  const data = await response.json();

  if (response.status != 200) {
    console.log(data.error);
  }

  if (data.access_token && data.access_token != 'undefined') {
    return [data.access_token, data.expires_in];
  } else return undefined;
}
