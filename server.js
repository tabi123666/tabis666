// 服务器主文件
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const db = require('./database');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 配置CORS
app.use(cors());

// 设置UTF-8编码
app.use(express.urlencoded({ extended: true, limit: '50mb', charset: 'utf-8' }));
app.use(express.json({ limit: '50mb', charset: 'utf-8' }));

// 配置静态文件目录
app.use(express.static(path.join(__dirname)));

// 确保uploads目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 配置multer文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // 确保文件名使用正确的UTF-8编码
        let originalName = file.originalname;
        // 尝试多种方式解码文件名
        try {
            // 如果文件名已经是乱码，尝试转换
            if (originalName.match(/[^\x00-\x7F]/)) {
                originalName = Buffer.from(originalName, 'binary').toString('utf8');
            }
        } catch (e) {
            console.log('文件名解码失败，使用原始名称');
        }
        const extension = path.extname(originalName);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // 允许的文件类型
        const allowedTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('文件类型不支持'), false);
        }
    }
});

// API端点：上传文件
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: '请选择要上传的文件' });
    }

    // 确保原始文件名使用正确的UTF-8编码
    let originalName = req.file.originalname;
    // 尝试多种方式解码文件名
    try {
        // 如果文件名已经是乱码，尝试转换
        if (originalName.match(/[^\x00-\x7F]/)) {
            originalName = Buffer.from(originalName, 'binary').toString('utf8');
        }
        // 确保文件名是有效的UTF-8
        originalName = decodeURIComponent(encodeURIComponent(originalName).replace(/\%2B/g, '+'));
    } catch (e) {
        console.log('文件名解码失败，使用原始名称');
    }
    
    const fileData = {
        filename: req.file.filename,
        originalname: originalName,
        mimetype: req.file.mimetype,
        size: req.file.size,
        filepath: req.file.path
    };

    // 保存文件信息到数据库
    db.insertFile(fileData, (err, fileId) => {
        if (err) {
            return res.status(500).json({ success: false, message: '保存文件信息失败' });
        }
        res.status(200).json({ success: true, message: '文件上传成功', fileId: fileId });
    });
});

// API端点：获取所有文件
app.get('/api/files', (req, res) => {
    db.getAllFiles((err, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: '获取文件列表失败' });
        }
        res.status(200).json({ success: true, files: files });
    });
});

// API端点：搜索文件
app.get('/api/search', (req, res) => {
    const keyword = req.query.q || '';
    if (!keyword.trim()) {
        return res.status(200).json({ success: true, files: [] });
    }

    db.searchFiles(keyword, (err, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: '搜索文件失败' });
        }
        res.status(200).json({ success: true, files: files });
    });
});

// API端点：下载文件
app.get('/api/download/:id', (req, res) => {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
        return res.status(400).json({ success: false, message: '无效的文件ID' });
    }

    db.getFileById(fileId, (err, file) => {
        if (err) {
            return res.status(500).json({ success: false, message: '获取文件信息失败' });
        }

        if (!file) {
            return res.status(404).json({ success: false, message: '文件不存在' });
        }

        // 检查文件是否存在
        if (!fs.existsSync(file.filepath)) {
            return res.status(404).json({ success: false, message: '文件已被删除' });
        }

        // 设置响应头，正确处理中文文件名
        res.setHeader('Content-Type', file.mimetype);
        // 使用RFC 5987标准编码中文文件名
        const encodedFilename = encodeURIComponent(file.originalname).replace(/['()]/g, escape);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}; filename="${encodedFilename}"`);
        res.setHeader('Content-Length', file.size);

        // 发送文件
        const fileStream = fs.createReadStream(file.filepath);
        fileStream.pipe(res);
    });
});

// API端点：删除文件
app.delete('/api/files/:id', (req, res) => {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
        return res.status(400).json({ success: false, message: '无效的文件ID' });
    }

    db.getFileById(fileId, (err, file) => {
        if (err) {
            console.error('获取文件信息失败:', err);
            return res.status(500).json({ success: false, message: '获取文件信息失败' });
        }

        if (!file) {
            return res.status(404).json({ success: false, message: '文件不存在' });
        }

        // 检查文件是否存在
        if (!fs.existsSync(file.filepath)) {
            console.log('警告：物理文件不存在，但仍删除数据库记录:', file.filepath);
            // 即使物理文件不存在，也要删除数据库记录
            db.deleteFile(fileId, (err) => {
                if (err) {
                    console.error('删除文件记录失败:', err);
                    return res.status(500).json({ success: false, message: '删除文件记录失败' });
                }
                return res.status(200).json({ success: true, message: '文件记录已删除' });
            });
            return;
        }

        // 删除文件
        fs.unlink(file.filepath, (err) => {
            if (err) {
                console.error('删除物理文件失败:', err);
                return res.status(500).json({ success: false, message: `删除物理文件失败: ${err.message}` });
            }

            // 删除数据库记录
            db.deleteFile(fileId, (err) => {
                if (err) {
                    console.error('删除文件记录失败:', err);
                    return res.status(500).json({ success: false, message: '删除文件记录失败' });
                }
                res.status(200).json({ success: true, message: '文件删除成功' });
            });
        });
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器已启动，监听端口 ${PORT}`);
    console.log(`访问地址: http://localhost:${PORT}`);
});