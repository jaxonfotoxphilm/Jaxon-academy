// test-wiki.js
import https from 'https';
const fetchWikipedia = (title) => {
    return new Promise((resolve, reject) => {
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(title)}&format=json`;
        https.get(url, { headers: { 'User-Agent': 'AbekaScholar/1.0 (test@example.com)' } }, (res) => {
            console.log("Status:", res.statusCode);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log("Data length:", data.length);
            });
        });
    });
};
fetchWikipedia('Mathematics');
