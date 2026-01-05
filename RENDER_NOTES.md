# Render部署注意事项

## 为什么上传的文件会丢失？

**Render是一个无状态的平台**，这意味着：
- 每次重启或重新部署应用时，所有临时文件都会被清理
- `uploads/`目录中的文件会丢失
- `files.db`数据库文件会重置

## 解决方案

### 短期解决方案（用于测试）
1. 每次部署后重新上传需要的文件
2. 注意：所有文件和数据会在下次部署时丢失

### 长期解决方案（生产环境）

#### 1. 使用云存储服务
- **推荐**：Amazon S3、Google Cloud Storage或Azure Blob Storage
- 将文件存储在云存储服务中，而不是本地`uploads/`目录
- 数据库中只存储文件的URL和元数据

#### 2. 使用外部数据库
- 将SQLite数据库替换为外部数据库服务
- **推荐**：PostgreSQL（Render提供免费的PostgreSQL服务）
- 这样数据会持久化存储，不受应用重启影响

## 如何修改代码实现持久化存储

### 1. 配置云存储（以AWS S3为例）

```bash
npm install aws-sdk multer-s3
```

修改`server.js`中的存储配置：

```javascript
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

// 配置AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// 使用S3存储
const storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET_NAME,
  acl: 'private', // 或 'public-read'
  key: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `uploads/${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});
```

### 2. 使用外部PostgreSQL数据库

```bash
npm install pg
```

修改`database.js`：

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 修改所有数据库操作函数使用pg语法
```

## Render环境变量配置

在Render控制面板中添加以下环境变量：

### 用于云存储
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET_NAME`

### 用于外部数据库
- `DATABASE_URL`（Render PostgreSQL服务提供）

## 总结

- **测试阶段**：可以使用当前配置，但要注意文件会在部署后丢失
- **生产阶段**：必须实现持久化存储解决方案
- **推荐方案**：Render PostgreSQL + AWS S3（或其他云存储）

如果您需要帮助实现持久化存储解决方案，请随时提问！