// 文件上传下载系统

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fileList = document.getElementById('fileList');
    const searchHint = document.getElementById('searchHint');

    // 事件监听
    fileInput.addEventListener('change', handleFileUpload);
    searchBtn.addEventListener('click', handleSearch);
    clearBtn.addEventListener('click', handleClear);
    searchInput.addEventListener('input', handleSearch);

    // 初始化状态：获取并显示所有文件
    getFilesFromServer().then(files => {
        loadFileList(files);
    });
});

// 处理文件上传
function handleFileUpload(event) {
    const files = event.target.files;
    const uploadStatus = document.getElementById('uploadStatus');
    
    if (files.length === 0) return;

    let uploadedCount = 0;
    
    // 遍历上传的文件
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 验证文件类型
        if (!validateFileType(file)) {
            uploadStatus.innerHTML = `<p style="color: #e53e3e;">文件类型不支持: ${file.name}</p>`;
            continue;
        }

        // 模拟文件上传成功
        // 这里可以添加文件上传的动画或进度显示
        setTimeout(() => {
            // 创建上传文件的元数据
            const uploadedFile = {
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                originalname: file.name,
                mimetype: file.type || 'application/octet-stream',
                size: file.size,
                upload_date: new Date().toISOString()
            };
            
            // 添加到临时存储
            uploadedFiles.unshift(uploadedFile);
            
            uploadedCount++;
            
            // 更新状态
            if (uploadedCount === files.length) {
                uploadStatus.innerHTML = `<p style="color: #48bb78;">成功上传 ${uploadedCount} 个文件</p>`;
                
                // 清空文件输入
                document.getElementById('fileInput').value = '';
                
                // 上传完成后自动获取并显示所有文件列表（包括新上传的文件）
                getFilesFromServer().then(files => {
                    loadFileList(files);
                });
                
                // 3秒后清除状态
                setTimeout(() => {
                    uploadStatus.innerHTML = '';
                }, 3000);
            }
        }, 500); // 模拟上传延迟
    }
}

// 验证文件类型
function validateFileType(file) {
    // 支持的MIME类型列表
    const allowedTypes = [
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/pdf', // .pdf
        'image/jpeg', // .jpg
        'image/png', // .png
        'image/gif', // .gif
        'image/jpg', // .jpg
        // 额外的Word文件MIME类型支持
        'application/vnd.ms-word.document.macroEnabled.12', // .docm
        'application/vnd.ms-word.template.macroEnabled.12', // .dotm
        'application/vnd.ms-word.template', // .dot
        'application/vnd.openxmlformats-officedocument.wordprocessingml.template' // .dotx
    ];
    
    // 支持的文件扩展名列表
    const allowedExtensions = [
        '.doc', '.docx', '.docm', '.dot', '.dotm', '.dotx', // Word文件
        '.pdf', // PDF文件
        '.jpg', '.jpeg', '.png', '.gif' // 图片文件
    ];
    
    // 检查MIME类型
    if (allowedTypes.includes(file.type)) {
        return true;
    }
    
    // 如果MIME类型不匹配，检查文件扩展名作为后备方案
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some(ext => fileName.endsWith(ext));
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 临时存储上传的文件（用于本地测试）
let uploadedFiles = [];

// 获取所有文件（模拟数据，用于本地测试）
async function getFilesFromServer() {
    // 基础模拟文件数据
    const baseFiles = [
        {
            id: '1',
            originalname: '测试文档.docx',
            mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 1024 * 1024, // 1MB
            upload_date: new Date().toISOString()
        },
        {
            id: '2',
            originalname: '示例图片.jpg',
            mimetype: 'image/jpeg',
            size: 512 * 1024, // 512KB
            upload_date: new Date().toISOString()
        },
        {
            id: '3',
            originalname: '演示PDF.pdf',
            mimetype: 'application/pdf',
            size: 2 * 1024 * 1024, // 2MB
            upload_date: new Date().toISOString()
        }
    ];
    
    // 合并基础文件和上传的文件
    return [...uploadedFiles, ...baseFiles];
}

// 搜索文件（模拟搜索，用于本地测试）
async function searchFilesFromServer(keyword) {
    if (!keyword) {
        return getFilesFromServer();
    }
    
    // 模拟搜索功能
    const allFiles = await getFilesFromServer();
    return allFiles.filter(file => 
        file.originalname.toLowerCase().includes(keyword.toLowerCase()) ||
        file.mimetype.toLowerCase().includes(keyword.toLowerCase())
    );
}

// 加载文件列表
function loadFileList(files = null) {
    const fileList = document.getElementById('fileList');
    const searchHint = document.getElementById('searchHint');
    const filesToShow = files || [];
    
    // 显示文件列表，隐藏搜索提示（如果存在）
    if (searchHint) {
        searchHint.style.display = 'none';
    }
    fileList.style.display = 'grid';
    
    if (filesToShow.length === 0) {
        fileList.innerHTML = `
            <div class="empty-state">
                <span>🔍</span>
                <p>未找到匹配的文件</p>
                <small>请尝试其他搜索关键词</small>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    filesToShow.forEach(file => {
        const fileType = getFileType(file.mimetype);
        const fileIcon = getFileIcon(fileType);
        
        html += `
            <div class="file-item">
                <div class="file-icon ${fileType}">${fileIcon}</div>
                <div class="file-info">
                    <div class="file-name">${file.originalname}</div>
                    <div class="file-meta">
                        <small>${file.mimetype.split('/')[1]}</small>
                        <small>• ${formatFileSize(file.size)}</small>
                        <small>• ${new Date(file.upload_date).toLocaleString()}</small>
                    </div>
                </div>
                <div class="file-actions">
                    <a href="/api/download/${file.id}" class="download-btn" download="${file.originalname}">下载</a>
                </div>
            </div>
        `;
    });
    
    fileList.innerHTML = html;
}

// 获取文件类型
function getFileType(mimeType) {
    if (mimeType.includes('word') || mimeType.includes('msword')) {
        return 'word';
    } else if (mimeType.includes('pdf')) {
        return 'pdf';
    } else if (mimeType.includes('image')) {
        return 'image';
    }
    return 'other';
}

// 获取文件图标
function getFileIcon(fileType) {
    const icons = {
        word: '📄',
        pdf: '📑',
        image: '🖼️',
        other: '📁'
    };
    return icons[fileType] || icons.other;
}

// 处理搜索
async function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm.trim()) {
        // 没有搜索词时，显示所有文件
        const files = await getFilesFromServer();
        loadFileList(files);
        return;
    }
    
    // 从服务器搜索文件
    const filteredFiles = await searchFilesFromServer(searchTerm);
    
    loadFileList(filteredFiles);
}

// 处理清空搜索
async function handleClear() {
    document.getElementById('searchInput').value = '';
    // 清空搜索时，显示所有文件
    const files = await getFilesFromServer();
    loadFileList(files);
}

// 下载文件由服务器直接处理，不再需要前端函数

// 删除功能暂时注释，如需恢复可取消注释并添加相应API
/*
function deleteFile(fileId) {
    if (confirm('确定要删除这个文件吗？')) {
        fetch(`/api/files/${fileId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 重新加载搜索结果
                const searchTerm = document.getElementById('searchInput').value.toLowerCase();
                if (searchTerm) {
                    handleSearch();
                }
            } else {
                alert('删除文件失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('删除文件错误:', error);
            alert('删除文件时发生错误');
        });
    }
}
*/

// 支持拖拽上传
document.addEventListener('DOMContentLoaded', function() {
    const uploadContainer = document.querySelector('.upload-container');
    
    uploadContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#667eea';
        this.style.backgroundColor = '#edf2f7';
    });
    
    uploadContainer.addEventListener('dragleave', function() {
        this.style.borderColor = '#cbd5e0';
        this.style.backgroundColor = '#f7fafc';
    });
    
    uploadContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '#cbd5e0';
        this.style.backgroundColor = '#f7fafc';
        
        // 获取拖拽的文件
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // 设置文件到input
            const fileInput = document.getElementById('fileInput');
            fileInput.files = files;
            
            // 触发上传
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    });
});