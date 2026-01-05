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

    // 初始化状态：自动加载并显示所有上传的文件
    loadAllFiles();
});

// 加载所有文件
async function loadAllFiles() {
    try {
        const response = await fetch('/api/files');
        const data = await response.json();
        if (data.success) {
            loadFileList(data.files);
        } else {
            console.error('获取文件列表失败:', data.message);
        }
    } catch (error) {
        console.error('获取文件列表错误:', error);
    }
}

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

        // 创建FormData对象
        const formData = new FormData();
        formData.append('file', file);

        // 发送文件到后端
        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                uploadedCount++;
            } else {
                console.error('文件上传失败:', data.message);
            }
            
            // 更新状态
            if (uploadedCount === files.length) {
                uploadStatus.innerHTML = `<p style="color: #48bb78;">成功上传 ${uploadedCount} 个文件</p>`;
                
                // 清空文件输入
                document.getElementById('fileInput').value = '';
                
                // 上传完成后重新加载所有文件，让用户能立即看到新上传的文件
                loadAllFiles();
                
                // 3秒后清除状态
                setTimeout(() => {
                    uploadStatus.innerHTML = '';
                }, 3000);
            }
        })
        .catch(error => {
            console.error('上传错误:', error);
            uploadStatus.innerHTML = `<p style="color: #e53e3e;">文件上传失败: ${file.name}</p>`;
        });
    }
}

// 验证文件类型
function validateFileType(file) {
    const allowedTypes = [
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/pdf', // .pdf
        'image/jpeg', // .jpg
        'image/png', // .png
        'image/gif', // .gif
        'image/jpg' // .jpg
    ];
    
    return allowedTypes.includes(file.type);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取所有文件（从服务器）
async function getFilesFromServer() {
    try {
        const response = await fetch('/api/files');
        const data = await response.json();
        if (data.success) {
            return data.files;
        } else {
            console.error('获取文件列表失败:', data.message);
            return [];
        }
    } catch (error) {
        console.error('获取文件列表错误:', error);
        return [];
    }
}

// 搜索文件（从服务器）
async function searchFilesFromServer(keyword) {
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
        const data = await response.json();
        if (data.success) {
            return data.files;
        } else {
            console.error('搜索文件失败:', data.message);
            return [];
        }
    } catch (error) {
        console.error('搜索文件错误:', error);
        return [];
    }
}

// 加载文件列表
function loadFileList(files = null) {
    const fileList = document.getElementById('fileList');
    const searchHint = document.getElementById('searchHint');
    const filesToShow = files || [];
    
    // 显示文件列表，隐藏搜索提示
    searchHint.style.display = 'none';
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
        // 确保文件名正确显示，防止乱码
        const fileName = decodeURIComponent(escape(file.originalname));
        const fileType = getFileType(file.mimetype);
        const fileIcon = getFileIcon(fileType);
        
        html += `
            <div class="file-item">
                <div class="file-icon ${fileType}">${fileIcon}</div>
                <div class="file-info">
                    <div class="file-name">${fileName}</div>
                    <div class="file-meta">
                        <small>${file.mimetype.split('/')[1]}</small>
                        <small>• ${formatFileSize(file.size)}</small>
                        <small>• ${new Date(file.upload_date).toLocaleString()}</small>
                    </div>
                </div>
                <div class="file-actions">
                    <a href="/api/download/${file.id}" class="download-btn" download="${fileName}">下载</a>
                    <button class="delete-btn" onclick="deleteFile(${file.id}, this)">删除</button>
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
        await loadAllFiles();
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
    await loadAllFiles();
}

// 删除文件
async function deleteFile(fileId, element) {
    if (confirm('确定要删除这个文件吗？此操作不可恢复！')) {
        try {
            const response = await fetch(`/api/files/${fileId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 从UI中移除该文件项
                element.closest('.file-item').remove();
                
                // 检查是否还有文件，如果没有则显示空状态
                const fileItems = document.querySelectorAll('.file-item');
                if (fileItems.length === 0) {
                    const fileList = document.getElementById('fileList');
                    fileList.innerHTML = `
                        <div class="empty-state">
                            <span>🔍</span>
                            <p>没有文件了</p>
                            <small>请上传或搜索其他文件</small>
                        </div>
                    `;
                }
            } else {
                alert('删除文件失败: ' + data.message);
            }
        } catch (error) {
            console.error('删除文件错误:', error);
            alert('删除文件时发生错误: ' + error.message);
        }
    }
}

// 下载文件由服务器直接处理，不再需要前端函数

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