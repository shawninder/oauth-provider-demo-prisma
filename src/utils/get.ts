import https from 'https'

// Helper function to perform GET requests over https
export default function get (url: URL): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, (res) => {
      let output = '';
      res.on('data', (chunk) => {
        output += chunk;
      });
      res.on('end', () => {
        return resolve(output);
      });
    });
    req.on('error', reject);
    req.end();
  });
}