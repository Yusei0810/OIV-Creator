// グローバル変数
let operations = [];
let uploadedFiles = new Map();
let currentOperationId = 0;

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    setupFileDropZone();
    updateXMLPreview();
    generateGUID();
});

// GUIDを生成
function generateGUID() {
    const guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    window.packageGuid = guid.toUpperCase();
}

// ファイルドロップゾーンの設定
function setupFileDropZone() {
    const dropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

// ファイル処理
function handleFiles(files) {
    const fileList = document.getElementById('file-list');
    
    for (let file of files) {
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uploadedFiles.set(fileId, file);
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file"></i>
                <span>${file.name}</span>
                <span class="file-size">(${formatFileSize(file.size)})</span>
            </div>
            <button class="btn btn-danger" onclick="removeFile('${fileId}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        fileList.appendChild(fileItem);
    }
}

// ファイルサイズフォーマット
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ファイル削除
function removeFile(fileId) {
    uploadedFiles.delete(fileId);
    updateFileList();
}

// ファイルリスト更新
function updateFileList() {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';
    
    uploadedFiles.forEach((file, fileId) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file"></i>
                <span>${file.name}</span>
                <span class="file-size">(${formatFileSize(file.size)})</span>
            </div>
            <button class="btn btn-danger" onclick="removeFile('${fileId}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        fileList.appendChild(fileItem);
    });
}

// 操作を追加
function addOperation(type) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    let modalContent = '';
    
    switch(type) {
        case 'file':
            modalContent = `
                <h3>ファイル操作を追加</h3>
                <div class="form-group">
                    <label>操作タイプ</label>
                    <select id="file-operation-type">
                        <option value="add">ファイル追加</option>
                        <option value="delete">ファイル削除</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>ソースファイル（contentフォルダ内のパス）</label>
                    <input type="text" id="file-source" placeholder="例: vehicle.yft">
                </div>
                <div class="form-group">
                    <label>宛先パス（ゲーム内のパス）</label>
                    <input type="text" id="file-destination" placeholder="例: x64\\levels\\gta5\\vehicles.rpf\\vehicle.yft">
                </div>
                <button class="btn btn-primary" onclick="confirmFileOperation()">追加</button>
            `;
            break;
            
        case 'archive':
            modalContent = `
                <h3>アーカイブ操作を追加</h3>
                <div class="form-group">
                    <label>アーカイブパス</label>
                    <input type="text" id="archive-path" placeholder="例: update\\update.rpf">
                </div>
                <div class="form-group">
                    <label>存在しない場合に作成</label>
                    <select id="archive-create">
                        <option value="False">いいえ</option>
                        <option value="True">はい</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>アーカイブタイプ</label>
                    <select id="archive-type">
                        <option value="RPF7">RPF7 (GTA V)</option>
                        <option value="RPF3">RPF3 (GTA IV)</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="confirmArchiveOperation()">追加</button>
            `;
            break;
            
        case 'text':
            modalContent = `
                <h3>テキスト編集を追加</h3>
                <div class="form-group">
                    <label>ファイルパス</label>
                    <input type="text" id="text-path" placeholder="例: dlclist.xml">
                </div>
                <div class="form-group">
                    <label>存在しない場合に作成</label>
                    <select id="text-create">
                        <option value="False">いいえ</option>
                        <option value="True">はい</option>
                    </select>
                </div>
                <div id="text-commands" class="commands-list">
                    <h4>コマンド</h4>
                    <button class="btn btn-secondary" onclick="addTextCommand()">
                        <i class="fas fa-plus"></i> コマンド追加
                    </button>
                </div>
                <button class="btn btn-primary" onclick="confirmTextOperation()">追加</button>
            `;
            break;
            
        case 'xml':
            modalContent = `
                <h3>XML編集を追加</h3>
                <div class="form-group">
                    <label>ファイルパス</label>
                    <input type="text" id="xml-path" placeholder="例: common\\data\\dlclist.xml">
                </div>
                <div id="xml-commands" class="commands-list">
                    <h4>コマンド</h4>
                    <button class="btn btn-secondary" onclick="addXMLCommand()">
                        <i class="fas fa-plus"></i> コマンド追加
                    </button>
                </div>
                <button class="btn btn-primary" onclick="confirmXMLOperation()">追加</button>
            `;
            break;
    }
    
    modalBody.innerHTML = modalContent;
    modal.style.display = 'block';
}

// テキストコマンド追加
function addTextCommand() {
    const container = document.getElementById('text-commands');
    const commandId = `text-cmd-${Date.now()}`;
    
    const commandDiv = document.createElement('div');
    commandDiv.className = 'command-item';
    commandDiv.id = commandId;
    commandDiv.innerHTML = `
        <div class="command-content">
            <select onchange="updateTextCommandFields('${commandId}')">
                <option value="add">行を追加</option>
                <option value="insert">行を挿入</option>
                <option value="replace">行を置換</option>
                <option value="delete">行を削除</option>
            </select>
            <div id="${commandId}-fields">
                <input type="text" placeholder="追加する行" class="command-text">
            </div>
        </div>
        <button class="btn btn-danger" onclick="removeCommand('${commandId}')">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.insertBefore(commandDiv, container.lastElementChild);
}

// XMLコマンド追加
function addXMLCommand() {
    const container = document.getElementById('xml-commands');
    const commandId = `xml-cmd-${Date.now()}`;
    
    const commandDiv = document.createElement('div');
    commandDiv.className = 'command-item';
    commandDiv.id = commandId;
    commandDiv.innerHTML = `
        <div class="command-content">
            <select onchange="updateXMLCommandFields('${commandId}')">
                <option value="add">要素を追加</option>
                <option value="replace">要素を置換</option>
                <option value="remove">要素を削除</option>
            </select>
            <div id="${commandId}-fields">
                <input type="text" placeholder="XPATH" class="command-xpath">
                <textarea placeholder="追加するXML" class="command-xml"></textarea>
            </div>
        </div>
        <button class="btn btn-danger" onclick="removeCommand('${commandId}')">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.insertBefore(commandDiv, container.lastElementChild);
}

// コマンドフィールド更新
function updateTextCommandFields(commandId) {
    const select = document.querySelector(`#${commandId} select`);
    const fieldsDiv = document.getElementById(`${commandId}-fields`);
    
    switch(select.value) {
        case 'add':
            fieldsDiv.innerHTML = `<input type="text" placeholder="追加する行" class="command-text">`;
            break;
        case 'insert':
            fieldsDiv.innerHTML = `
                <select class="command-where">
                    <option value="After">後に</option>
                    <option value="Before">前に</option>
                </select>
                <input type="text" placeholder="基準となる行" class="command-line">
                <select class="command-condition">
                    <option value="Equal">完全一致</option>
                    <option value="StartWith">先頭一致</option>
                    <option value="Mask">マスク</option>
                </select>
                <input type="text" placeholder="挿入する行" class="command-text">
            `;
            break;
        case 'replace':
            fieldsDiv.innerHTML = `
                <input type="text" placeholder="検索する行" class="command-line">
                <select class="command-condition">
                    <option value="Equal">完全一致</option>
                    <option value="StartWith">先頭一致</option>
                    <option value="Mask">マスク</option>
                </select>
                <input type="text" placeholder="置換後の行" class="command-text">
            `;
            break;
        case 'delete':
            fieldsDiv.innerHTML = `
                <input type="text" placeholder="削除する行" class="command-line">
                <select class="command-condition">
                    <option value="Equal">完全一致</option>
                    <option value="StartWith">先頭一致</option>
                    <option value="Mask">マスク</option>
                </select>
            `;
            break;
    }
}

function updateXMLCommandFields(commandId) {
    const select = document.querySelector(`#${commandId} select`);
    const fieldsDiv = document.getElementById(`${commandId}-fields`);
    
    switch(select.value) {
        case 'add':
        case 'replace':
            fieldsDiv.innerHTML = `
                <input type="text" placeholder="XPATH" class="command-xpath">
                <textarea placeholder="XML内容" class="command-xml"></textarea>
            `;
            break;
        case 'remove':
            fieldsDiv.innerHTML = `<input type="text" placeholder="XPATH" class="command-xpath">`;
            break;
    }
}

// コマンド削除
function removeCommand(commandId) {
    document.getElementById(commandId).remove();
}

// 各操作の確認
function confirmFileOperation() {
    const operationType = document.getElementById('file-operation-type').value;
    const source = document.getElementById('file-source').value;
    const destination = document.getElementById('file-destination').value;
    
    operations.push({
        id: currentOperationId++,
        type: 'file',
        operationType,
        source,
        destination
    });
    
    updateOperationsDisplay();
    closeModal();
    updateXMLPreview();
}

function confirmArchiveOperation() {
    const path = document.getElementById('archive-path').value;
    const createIfNotExist = document.getElementById('archive-create').value;
    const archiveType = document.getElementById('archive-type').value;
    
    operations.push({
        id: currentOperationId++,
        type: 'archive',
        path,
        createIfNotExist,
        archiveType,
        children: []
    });
    
    updateOperationsDisplay();
    closeModal();
    updateXMLPreview();
}

function confirmTextOperation() {
    const path = document.getElementById('text-path').value;
    const createIfNotExist = document.getElementById('text-create').value;
    const commands = [];
    
    document.querySelectorAll('[id^="text-cmd-"]').forEach(cmdDiv => {
        const cmdType = cmdDiv.querySelector('select').value;
        const fields = cmdDiv.querySelector('[id$="-fields"]');
        
        const command = { type: cmdType };
        
        switch(cmdType) {
            case 'add':
                command.text = fields.querySelector('.command-text').value;
                break;
            case 'insert':
                command.where = fields.querySelector('.command-where').value;
                command.line = fields.querySelector('.command-line').value;
                command.condition = fields.querySelector('.command-condition').value;
                command.text = fields.querySelector('.command-text').value;
                break;
            case 'replace':
                command.line = fields.querySelector('.command-line').value;
                command.condition = fields.querySelector('.command-condition').value;
                command.text = fields.querySelector('.command-text').value;
                break;
            case 'delete':
                command.line = fields.querySelector('.command-line').value;
                command.condition = fields.querySelector('.command-condition').value;
                break;
        }
        
        commands.push(command);
    });
    
    operations.push({
        id: currentOperationId++,
        type: 'text',
        path,
        createIfNotExist,
        commands
    });
    
    updateOperationsDisplay();
    closeModal();
    updateXMLPreview();
}

function confirmXMLOperation() {
    const path = document.getElementById('xml-path').value;
    const commands = [];
    
    document.querySelectorAll('[id^="xml-cmd-"]').forEach(cmdDiv => {
        const cmdType = cmdDiv.querySelector('select').value;
        const fields = cmdDiv.querySelector('[id$="-fields"]');
        
        const command = { type: cmdType };
        
        switch(cmdType) {
            case 'add':
            case 'replace':
                command.xpath = fields.querySelector('.command-xpath').value;
                command.xml = fields.querySelector('.command-xml').value;
                break;
            case 'remove':
                command.xpath = fields.querySelector('.command-xpath').value;
                break;
        }
        
        commands.push(command);
    });
    
    operations.push({
        id: currentOperationId++,
        type: 'xml',
        path,
        commands
    });
    
    updateOperationsDisplay();
    closeModal();
    updateXMLPreview();
}

// 操作表示を更新
function updateOperationsDisplay() {
    const container = document.getElementById('operations-container');
    container.innerHTML = '';
    
    operations.forEach(op => {
        const opDiv = document.createElement('div');
        opDiv.className = 'operation-item';
        
        let content = '';
        switch(op.type) {
            case 'file':
                content = `
                    <div class="operation-header">
                        <span class="operation-type"><i class="fas fa-file"></i> ファイル${op.operationType === 'add' ? '追加' : '削除'}</span>
                        <div class="operation-actions">
                            <button class="btn btn-danger" onclick="removeOperation(${op.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div>ソース: ${op.source || 'N/A'}</div>
                    <div>宛先: ${op.destination || 'N/A'}</div>
                `;
                break;
            case 'archive':
                content = `
                    <div class="operation-header">
                        <span class="operation-type"><i class="fas fa-archive"></i> アーカイブ操作</span>
                        <div class="operation-actions">
                            <button class="btn btn-danger" onclick="removeOperation(${op.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div>パス: ${op.path}</div>
                    <div>タイプ: ${op.archiveType}</div>
                `;
                break;
            case 'text':
                content = `
                    <div class="operation-header">
                        <span class="operation-type"><i class="fas fa-file-alt"></i> テキスト編集</span>
                        <div class="operation-actions">
                            <button class="btn btn-danger" onclick="removeOperation(${op.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div>パス: ${op.path}</div>
                    <div>コマンド数: ${op.commands.length}</div>
                `;
                break;
            case 'xml':
                content = `
                    <div class="operation-header">
                        <span class="operation-type"><i class="fas fa-code"></i> XML編集</span>
                        <div class="operation-actions">
                            <button class="btn btn-danger" onclick="removeOperation(${op.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div>パス: ${op.path}</div>
                    <div>コマンド数: ${op.commands.length}</div>
                `;
                break;
        }
        
        opDiv.innerHTML = content;
        container.appendChild(opDiv);
    });
}

// 操作を削除
function removeOperation(id) {
    operations = operations.filter(op => op.id !== id);
    updateOperationsDisplay();
    updateXMLPreview();
}

// XMLプレビューを更新
function updateXMLPreview() {
    const preview = document.getElementById('xml-preview');
    const xml = generateAssemblyXML();
    preview.innerHTML = `<code>${escapeHtml(xml)}</code>`;
}

// assembly.xmlを生成
function generateAssemblyXML() {
    const packageName = document.getElementById('package-name').value || 'Untitled Package';
    const versionMajor = document.getElementById('version-major').value || '1';
    const versionMinor = document.getElementById('version-minor').value || '0';
    const versionTag = document.getElementById('version-tag').value;
    const targetGame = document.getElementById('target-game').value;
    const authorName = document.getElementById('author-name').value || 'Unknown';
    const authorLink = document.getElementById('author-link').value;
    const description = document.getElementById('description').value;
    const descriptionFooterLink = document.getElementById('description-footer-link').value;
    const licence = document.getElementById('licence').value;
    const licenceFooterLink = document.getElementById('licence-footer-link').value;
    const webUrl = document.getElementById('web-url').value;
    // カラーコードを正しい形式に変換 (#RRGGBB -> $AARRGGBB)
    const headerBg = '$FF' + document.getElementById('header-bg').value.substring(1);
    const iconBg = '$FF' + document.getElementById('icon-bg').value.substring(1);
    const useBlackText = document.getElementById('use-black-text').checked;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<package version="2.2" id="{${window.packageGuid}}" target="${targetGame}">
    <metadata>
        <name>${escapeXml(packageName)}</name>
        <version>
            <major>${versionMajor}</major>
            <minor>${versionMinor}</minor>`;
    
    if (versionTag) {
        xml += `
            <tag>${escapeXml(versionTag)}</tag>`;
    }
    
    xml += `
        </version>
        <author>
            <displayName>${escapeXml(authorName)}</displayName>`;
    
    if (authorLink) {
        xml += `
            <actionLink>${escapeXml(authorLink)}</actionLink>`;
    }
    
    xml += `
        </author>`;
    
    if (description) {
        xml += `
        <description footerLink="${escapeXml(descriptionFooterLink || '')}"><![CDATA[${description}]]></description>`;
    }
    
    if (licence) {
        xml += `
        <licence footerLink="${escapeXml(licenceFooterLink || '')}"><![CDATA[${licence}]]></licence>`;
    }
    
    if (webUrl) {
        xml += `
        <weburl>${escapeXml(webUrl)}</weburl>`;
    }
    
    xml += `
    </metadata>
    <colors>
        <headerBackground useBlackTextColor="${useBlackText ? 'True' : 'False'}">${headerBg}</headerBackground>
        <iconBackground>${iconBg}</iconBackground>
    </colors>
    <content>`;
    
    // 操作を追加
    operations.forEach(op => {
        xml += generateOperationXML(op, 2);
    });
    
    xml += `
    </content>
</package>`;
    
    return xml;
}

// 操作XMLを生成
function generateOperationXML(op, indent) {
    const spaces = '    '.repeat(indent);
    let xml = '';
    
    switch(op.type) {
        case 'file':
            if (op.operationType === 'add') {
                xml += `\n${spaces}<add source="${escapeXml(op.source)}">${escapeXml(op.destination)}</add>`;
            } else {
                xml += `\n${spaces}<delete>${escapeXml(op.destination)}</delete>`;
            }
            break;
            
        case 'archive':
            xml += `\n${spaces}<archive path="${escapeXml(op.path)}" createIfNotExist="${op.createIfNotExist}" type="${op.archiveType}">`;
            if (op.children) {
                op.children.forEach(child => {
                    xml += generateOperationXML(child, indent + 1);
                });
            }
            xml += `\n${spaces}</archive>`;
            break;
            
        case 'text':
            xml += `\n${spaces}<text path="${escapeXml(op.path)}" createIfNotExist="${op.createIfNotExist}">`;
            op.commands.forEach(cmd => {
                switch(cmd.type) {
                    case 'add':
                        xml += `\n${spaces}    <add>${escapeXml(cmd.text)}</add>`;
                        break;
                    case 'insert':
                        xml += `\n${spaces}    <insert where="${cmd.where}" line="${escapeXml(cmd.line)}" condition="${cmd.condition}">${escapeXml(cmd.text)}</insert>`;
                        break;
                    case 'replace':
                        xml += `\n${spaces}    <replace line="${escapeXml(cmd.line)}" condition="${cmd.condition}">${escapeXml(cmd.text)}</replace>`;
                        break;
                    case 'delete':
                        xml += `\n${spaces}    <delete condition="${cmd.condition}">${escapeXml(cmd.line)}</delete>`;
                        break;
                }
            });
            xml += `\n${spaces}</text>`;
            break;
            
        case 'xml':
            xml += `\n${spaces}<xml path="${escapeXml(op.path)}">`;
            op.commands.forEach(cmd => {
                switch(cmd.type) {
                    case 'add':
                        xml += `\n${spaces}    <add xpath="${escapeXml(cmd.xpath)}">\n${spaces}        ${cmd.xml}\n${spaces}    </add>`;
                        break;
                    case 'replace':
                        xml += `\n${spaces}    <replace xpath="${escapeXml(cmd.xpath)}">\n${spaces}        ${cmd.xml}\n${spaces}    </replace>`;
                        break;
                    case 'remove':
                        xml += `\n${spaces}    <remove xpath="${escapeXml(cmd.xpath)}"/>`;
                        break;
                }
            });
            xml += `\n${spaces}</xml>`;
            break;
    }
    
    return xml;
}

// XMLエスケープ
function escapeXml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
}

// HTMLエスケープ
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// XMLをコピー
function copyXML() {
    const xml = generateAssemblyXML();
    navigator.clipboard.writeText(xml).then(() => {
        alert('XMLをクリップボードにコピーしました！');
    });
}

// テンプレート適用
function applyTemplate() {
    const template = document.getElementById('template-select').value;
    
    // 既存の操作をクリア
    operations = [];
    
    switch(template) {
        case 'vehicle-addon':
            // 車両アドオンテンプレート
            document.getElementById('package-name').value = 'Vehicle Addon Pack';
            document.getElementById('description').value = 'Adds a new vehicle to GTA V';
            
            operations = [
                {
                    id: currentOperationId++,
                    type: 'archive',
                    path: 'dlc_packs:',
                    createIfNotExist: 'True',
                    archiveType: 'RPF7',
                    children: []
                },
                {
                    id: currentOperationId++,
                    type: 'archive',
                    path: 'update\\update.rpf',
                    createIfNotExist: 'False',
                    archiveType: 'RPF7',
                    children: []
                }
            ];
            
            // dlclist.xml編集を追加
            const updateArchive = operations.find(op => op.path === 'update\\update.rpf');
            if (updateArchive) {
                operations.push({
                    id: currentOperationId++,
                    type: 'xml',
                    path: 'common\\data\\dlclist.xml',
                    commands: [{
                        type: 'add',
                        xpath: '/SMandatoryPacksData/Paths',
                        xml: '<Item>dlc_packs:/mycar/</Item>'
                    }]
                });
            }
            break;
            
        case 'vehicle-replace':
            document.getElementById('package-name').value = 'Vehicle Replace Pack';
            document.getElementById('description').value = 'Replaces an existing vehicle in GTA V';
            
            operations = [
                {
                    id: currentOperationId++,
                    type: 'archive',
                    path: 'x64e.rpf',
                    createIfNotExist: 'False',
                    archiveType: 'RPF7',
                    children: []
                }
            ];
            break;
            
        case 'script':
            document.getElementById('package-name').value = 'Script Mod';
            document.getElementById('description').value = 'Adds a new script to GTA V';
            
            operations = [
                {
                    id: currentOperationId++,
                    type: 'file',
                    operationType: 'add',
                    source: 'ScriptHookV.dll',
                    destination: 'ScriptHookV.dll'
                },
                {
                    id: currentOperationId++,
                    type: 'file',
                    operationType: 'add',
                    source: 'MyScript.asi',
                    destination: 'MyScript.asi'
                }
            ];
            break;
            
        case 'texture':
            document.getElementById('package-name').value = 'Texture Pack';
            document.getElementById('description').value = 'Replaces textures in GTA V';
            
            operations = [
                {
                    id: currentOperationId++,
                    type: 'archive',
                    path: 'x64a.rpf',
                    createIfNotExist: 'False',
                    archiveType: 'RPF7',
                    children: []
                }
            ];
            break;
    }
    
    updateOperationsDisplay();
    updateXMLPreview();
}

// OIVファイル生成
async function generateOIV() {
    const packageName = document.getElementById('package-name').value || 'untitled';
    
    // 必須フィールドのチェック
    if (!document.getElementById('package-name').value || 
        !document.getElementById('author-name').value) {
        alert('パッケージ名と作者名は必須です！');
        return;
    }
    
    // JSZipインスタンスを作成
    const zip = new JSZip();
    
    // assembly.xmlを追加
    const assemblyXml = generateAssemblyXML();
    zip.file('assembly.xml', assemblyXml);
    
    // contentフォルダを作成
    const contentFolder = zip.folder('content');
    
    // アップロードされたファイルを追加
    for (let [fileId, file] of uploadedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        contentFolder.file(file.name, arrayBuffer);
    }
    
    // アイコンがある場合は追加（ここではプレースホルダー）
    // 実際の実装では、アイコンアップロード機能を追加する必要があります
    
    // ZIPファイルを生成
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        // ダウンロードリンクを作成
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${packageName.replace(/[^a-zA-Z0-9]/g, '_')}.oiv`;
        link.click();
        
        // メモリをクリーンアップ
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
    });
}

// モーダルを閉じる
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// モーダル外クリックで閉じる
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}