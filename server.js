const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname, {
  index: 'index.html',
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'X文章转公众号格式工具运行正常' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
});