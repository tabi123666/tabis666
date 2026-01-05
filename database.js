// 数据库操作模块
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('成功连接到SQLite数据库');
        // 设置数据库编码为UTF-8
        db.run('PRAGMA encoding = "UTF-8"');
        // 创建文件表
        createFilesTable();
    }
});

// 创建文件表
function createFilesTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            originalname TEXT NOT NULL,
            mimetype TEXT NOT NULL,
            size INTEGER NOT NULL,
            filepath TEXT NOT NULL,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.run(sql, (err) => {
        if (err) {
            console.error('创建文件表失败:', err.message);
        } else {
            console.log('文件表创建成功');
        }
    });
}

// 插入文件记录
function insertFile(fileData, callback) {
    const sql = `
        INSERT INTO files (filename, originalname, mimetype, size, filepath)
        VALUES (?, ?, ?, ?, ?)
    `;
    
    const values = [
        fileData.filename,
        fileData.originalname,
        fileData.mimetype,
        fileData.size,
        fileData.filepath
    ];
    
    db.run(sql, values, function(err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, this.lastID);
    });
}

// 获取所有文件
function getAllFiles(callback) {
    const sql = 'SELECT * FROM files ORDER BY upload_date DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            callback(err);
            return;
        }
        callback(null, rows);
    });
}

// 根据ID获取文件
function getFileById(id, callback) {
    const sql = 'SELECT * FROM files WHERE id = ?';
    db.get(sql, [id], (err, row) => {
        if (err) {
            callback(err);
            return;
        }
        callback(null, row);
    });
}

// 搜索文件
function searchFiles(keyword, callback) {
    // 确保keyword是字符串类型
    const safeKeyword = keyword ? keyword.toString() : '';
    
    // 增强搜索功能：搜索文件名、原始文件名、文件类型和大小
    const sql = `
        SELECT * FROM files 
        WHERE 
            originalname LIKE ? OR 
            filename LIKE ? OR 
            mimetype LIKE ? OR
            size LIKE ?
        ORDER BY upload_date DESC
    `;
    
    const searchPattern = `%${safeKeyword}%`;
    db.all(sql, [searchPattern, searchPattern, searchPattern, searchPattern], (err, rows) => {
        if (err) {
            console.error('搜索文件错误:', err);
            callback(err);
            return;
        }
        callback(null, rows);
    });
}

// 删除文件
function deleteFile(fileId, callback) {
    const sql = 'DELETE FROM files WHERE id = ?';
    db.run(sql, [fileId], (err) => {
        if (err) {
            callback(err);
            return;
        }
        callback(null);
    });
}

module.exports = {
    insertFile,
    getAllFiles,
    getFileById,
    searchFiles,
    deleteFile
};
