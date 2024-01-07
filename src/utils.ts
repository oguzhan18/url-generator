type HttpHeaders = Record<string, string | undefined>;

export const isHtmlResponseExpected = (headers: HttpHeaders): boolean => {
  return headers['accept'] === 'text/html';
};
