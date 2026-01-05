# 文件共享系统部署指南

## 项目介绍
这是一个基于Node.js和Express的多用户文件共享系统，支持文件上传、搜索和下载功能。

## 项目结构
```
├── index.html          # 前端页面
├── style.css           # 样式文件
├── script.js           # 前端逻辑
├── server.js           # 后端服务器
├── database.js         # 数据库操作
├── package.json        # 项目配置
├── uploads/            # 文件存储目录
└── files.db            # SQLite数据库文件
```

## 系统要求
- Node.js 14+ 
- npm 6+

## 安装步骤

### 1. 克隆或下载项目
将项目文件下载到本地目录。

### 2. 安装依赖
在项目根目录执行以下命令：
```bash
npm install
```

### 3. 本地运行
启动服务器：
```bash
node server.js
```

服务器将在端口3000上运行，访问地址：http://localhost:3000

### 4. 开发模式（可选）
使用nodemon自动重启服务器：
```bash
npm run dev
```

## 部署到云平台

### 部署到Heroku

1. 注册Heroku账号并安装Heroku CLI
2. 登录Heroku：
   ```bash
   heroku login
   ```
3. 创建Heroku应用：
   ```bash
   heroku create your-app-name
   ```
4. 配置环境变量：
   ```bash
   heroku config:set NODE_ENV=production
   ```
5. 部署应用：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a your-app-name
   git push heroku master
   ```

### 部署到Vercel

1. 注册Vercel账号
2. 安装Vercel CLI：
   ```bash
   npm i -g vercel
   ```
3. 登录Vercel：
   ```bash
   vercel login
   ```
4. 部署应用：
   ```bash
   vercel
   ```

### 部署到Render

1. 注册Render账号
2. 创建新的Web Service
3. 连接GitHub仓库
4. 配置构建命令：`npm install`
5. 配置启动命令：`node server.js`
6. 部署应用

## 使用说明

### 上传文件
1. 点击"选择文件"按钮或拖拽文件到上传区域
2. 系统会自动上传文件到服务器
3. 支持上传多种类型的文件：Word、PDF、图片

### 搜索文件
1. 在搜索框中输入关键词
2. 系统会自动搜索匹配的文件
3. 支持搜索文件名、文件类型、扩展名等

### 下载文件
1. 在搜索结果中找到要下载的文件
2. 点击"下载"按钮即可下载文件

## 注意事项

1. **文件大小限制**：默认情况下，Node.js限制上传文件大小为100MB
   如需修改，可在server.js中添加：
   ```javascript
   app.use(express.json({ limit: '50mb' }));
   app.use(express.urlencoded({ limit: '50mb', extended: true }));
   ```

2. **文件存储**：上传的文件存储在服务器的`uploads`目录中
   部署到云平台时，需要确保该目录有写入权限

3. **数据库**：使用SQLite数据库，无需额外安装数据库软件
   部署到云平台时，数据库文件会随项目一起部署

4. **安全性**：
   - 建议添加用户认证功能
   - 建议添加文件访问权限控制
   - 建议定期备份数据库和文件

## 技术栈

- **前端**：HTML、CSS、JavaScript
- **后端**：Node.js、Express
- **文件上传**：Multer
- **数据库**：SQLite3
- **跨域支持**：CORS

## 功能扩展建议

1. 添加用户认证系统
2. 实现文件分类功能
3. 添加文件预览功能
4. 实现文件版本控制
5. 添加文件分享链接功能
6. 实现文件批量下载功能
