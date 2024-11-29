document.getElementById('translateBtn').addEventListener('click', async () => {
    const word = document.getElementById('wordInput').value.trim();
    if (!word) {
        alert('请输入一个单词！');
        return;
    }

    const translationOutput = document.getElementById('translationOutput');

    // 调用翻译API
    try {
        const result = await fetchTranslation(word);
        translationOutput.textContent = result.translation || '无法找到翻译结果';
        translationOutput.classList.remove('default-text');
        translationOutput.classList.add('has-result');

        // 直接传递原文和译文到历史记录，不要拼接箭头
        addToHistory(word, result.translation);
    } catch (error) {
        translationOutput.textContent = '翻译出错，请稍后重试。';
        console.error(error);
    }
});

// 使用百度翻译API，划线处放入你的API及密钥；注册地址：https://fanyi-api.baidu.com/manage/developer
async function fetchTranslation(word) {
    const appId = '——————————';
    const key = '————————';
    const salt = Date.now();
    const sign = md5(appId + word + salt + key);
    
    return new Promise((resolve, reject) => {
        const callbackName = 'JSONP_CALLBACK_' + salt;
        const script = document.createElement('script');
        
        // 设置超时处理
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('请求超时'));
        }, 10000);

        // 清理函数
        const cleanup = () => {
            clearTimeout(timeout);
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            delete window[callbackName];
        };
        
        // 回调函数
        window[callbackName] = function(data) {
            cleanup();
            console.log('收到翻译响应:', data);
            if (data && data.trans_result && data.trans_result.length > 0) {
                resolve({ translation: data.trans_result[0].dst });
            } else {
                reject(new Error(data.error_msg || '翻译失败'));
            }
        };
        
        // 构建URL
        const url = `http://api.fanyi.baidu.com/api/trans/vip/translate` +
            `?q=${encodeURIComponent(word)}` +
            `&from=en` +
            `&to=zh` +
            `&appid=${appId}` +
            `&salt=${salt}` +
            `&sign=${sign}` +
            `&callback=${callbackName}`;
        
        console.log('请求URL:', url);
        
        script.src = url;
        script.async = true;
        
        script.onerror = (error) => {
            console.error('脚本加载错误:', error);
            cleanup();
            reject(new Error('网络请求失败，请检查网络连接'));
        };
        
        document.body.appendChild(script);
    });
}

// 添加测试代码，方便在控制台直接调用
window.testTranslate = async (word) => {
    try {
        const result = await fetchTranslation(word);
        console.log('翻译结果:', result);
    } catch (error) {
        console.error('翻译错误:', error);
    }
};

// 添加回车键监听
document.getElementById('wordInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // 防止换行
        document.getElementById('translateBtn').click();
    }
});

// 修改历史记录添加方式
function addToHistory(english, chinese) {
    const tbody = document.querySelector('#translationHistory tbody');
    const tr = document.createElement('tr');
    
    // 移除可能存在的箭头符号，并清理多余的空格
    english = english.replace(/->|→/g, '').trim();
    chinese = chinese.replace(/->|→/g, '').trim();
    
    tr.innerHTML = `
        <td>${english}</td>
        <td>${chinese}</td>
        <td><button class="delete-btn">删除</button></td>
    `;
    
    // 添加删除功能
    tr.querySelector('.delete-btn').onclick = function() {
        tr.remove();
    };
    
    // 插入到表格顶部
    tbody.insertBefore(tr, tbody.firstChild);
}

// 添加发音功能
function speakWord(word) { // 定义发音函数
    const utterance = new SpeechSynthesisUtterance(word); // 创建发音对象
    utterance.lang = 'en-US'; // 设置语言为英语
    window.speechSynthesis.speak(utterance); // 播放发音
}

// 修改翻译历史的添加逻辑
function addTranslationToHistory(englishWord, chineseTranslation, grammar) { // 添加语法参数
    const historyTable = document.getElementById('translationHistory').getElementsByTagName('tbody')[0]; // 获取历史表格
    const newRow = historyTable.insertRow(); // 插入新行

    const englishCell = newRow.insertCell(0); // 插入英文单元格
    englishCell.textContent = englishWord; // 设置英文内容
    englishCell.onclick = () => speakWord(englishWord); // 点击发音

    const chineseCell = newRow.insertCell(1); // 插入中文单元格
    chineseCell.textContent = chineseTranslation; // 设置中文内容

    const grammarCell = newRow.insertCell(2); // 插入语法单元格
    grammarCell.textContent = grammar; // 设置语法内容
    grammarCell.style.width = '80px'; // 设置宽度

    const deleteCell = newRow.insertCell(3); // 插入操作单元格
    deleteCell.innerHTML = '<button class="delete-btn">删除</button>'; // 添加删除按钮
    deleteCell.querySelector('.delete-btn').onclick = () => newRow.remove(); // 删除行
}

document.getElementById('translateBtn').onclick = function() { // 点击翻译按钮
    const wordInput = document.getElementById('wordInput').value; // 获取输入的单词
    const translatedWord = translate(wordInput); // 假设有一个翻译函数
    const grammar = getGrammar(wordInput); // 假设有一个获取语法的函数

    addTranslationToHistory(wordInput, translatedWord, grammar); // 添加到翻译历史
    speakWord(wordInput); // 调用发音函数
};

document.getElementById('speakBtn').onclick = function() { // 点击发音按钮
    const wordInput = document.getElementById('wordInput').value; // 获取输入的单词
    speakWord(wordInput); // 调用发音函数
};
