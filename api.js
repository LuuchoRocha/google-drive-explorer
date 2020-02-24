const baseURL = 'https://www.googleapis.com/drive/v3/';
const folderMimeType = 'application/vnd.google-apps.folder';
const clientId = "774112931715-81n1dog1gg08tdabv5jtmi20ag06o6mh.apps.googleusercontent.com";
const clientSecret = "JPI7zzR8RHwtUifsHfa9OEr0";
const refreshToken = "1//044-RZji2OA6SCgYIARAAGAQSNwF-L9IrIvm29FmXlynudfVbHrnfqplwnua0h1dCrF-ogsFdacn8yMb0ALl5N1Hx_byl4y1GKpY";

async function getAccessToken() {
  try {
    const body = `grant_type=refresh_token&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&refresh_token=${encodeURIComponent(refreshToken)}`;
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      body,
    });
    const accessToken = (await response.json()).access_token;
    return accessToken;
  } catch (error) {
    console.warn(error);
    return null;
  }
};

const urls = {
  folderInfo: (id) => (baseURL + "files/" + id + "?fields=id,name"),
  folderFiles: (id) => (baseURL + "files?q=\"" + id + "\" in parents" + "&fields=files/id,files/name,files/mimeType,files/size,files/modifiedTime"),
  folderFilesCount: (id) => (baseURL + "files?q=\"" + id + "\" in parents" + "&fields=files/id"),
  downloadFile: (id) => (baseURL + "files/" + id + "?alt=media")
};

const buildFetchOptions = (accessToken) => {
  return {
    headers: buildAuthorizationHeader(accessToken)
  };
};

const buildAuthorizationHeader = (accessToken) => {
  return {
    Authorization: "Bearer " + accessToken
  };
};

export { getAccessToken, baseURL, folderMimeType, urls, buildFetchOptions, buildAuthorizationHeader };
