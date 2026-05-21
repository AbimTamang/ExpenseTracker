const fs = require('fs');
const path = require('path');

function replaceUrls(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceUrls(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('http://localhost:5000/api')) {
                // Replace double quotes
                content = content.replace(/"http:\/\/localhost:5000\/api([^"]*)"/g, '`${import.meta.env.VITE_API_URL}$1`');
                // Replace backticks (template literals)
                content = content.replace(/`http:\/\/localhost:5000\/api([^`]*)`/g, '`${import.meta.env.VITE_API_URL}$1`');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed:', fullPath);
            }
        }
    }
}
replaceUrls(path.join(__dirname, 'expense-tracker', 'src'));
