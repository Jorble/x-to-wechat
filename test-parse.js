const testMarkdown = `[![Image 1: Image](https://pbs.twimg.com/media/HB1CKkbbMAEHwF7?format=jpg&name=small)](https://x.com/msjiaozhu/article/2025879303213469711/media/2025848156731420673)

我用 OpenClaw 两周，烧掉 3000 元后发现：AI Agent 正在杀死 App Store

，3000 元，7 个模型。

[![Image 2: Image](https://pbs.twimg.com/media/HB1HiOUbkAAhUOr?format=jpg&name=900x900)](https://x.com/msjiaozhu/article/2025879303213469711/media/2025854060671504384)

/models 之后就可以直接选择 ZenMux 预设好的模型

[![Image 3: Image](https://pbs.twimg.com/media/HB1CkUmaoAAuozF?format=jpg&name=900x900)](https://x.com/msjiaozhu/article/2025879303213469711/media/2025848599159152640)`;

function testParseResponse(text) {
    let markdown = text;
    
    console.log('1. Original text length:', text.length);
    console.log('2. First 200 chars:', text.substring(0, 200));
    
    markdown = markdown.replace(/^Title:.*$/m, '');
    markdown = markdown.replace(/^URL Source:.*$/m, '');
    markdown = markdown.replace(/^Published Time:.*$/m, '');
    markdown = markdown.replace(/^Markdown Content:$/m, '');
    markdown = markdown.replace(/^Article\s*-+$/m, '');
    markdown = markdown.replace(/^Conversation\s*-+$/m, '');
    markdown = markdown.replace(/^-+$/gm, '');
    
    console.log('3. After cleaning headers');
    
    markdown = markdown.replace(/\[!\[Image.*?\]\((https:\/\/pbs\.twimg\.com\/[^)]+?)\)\]\(https:\/\/x\.com\/[^)]+\)/g, '![]($1)');
    
    console.log('4. After image conversion');
    console.log('5. Markdown after conversion first 500 chars:', markdown.substring(0, 500));
    
    console.log('6. Testing image regex on first line:');
    const firstLine = markdown.split('\n')[0];
    console.log('   Line:', firstLine);
    const match = firstLine.match(/^!\[([^\]]*)\]\((https:\/\/pbs\.twimg\.com\/[^)]+)\)$/);
    console.log('   Match:', match);
    if (match) {
        console.log('   match[1]:', match[1]);
        console.log('   match[2]:', match[2]);
        if (match[2]) {
            console.log('   replace result:', match[2].replace(/(name=)(small|medium|900x900)/, '$1large'));
        }
    }
    
    return markdown;
}

console.log('=== TEST 1 - Simulating image parsing ===');
testParseResponse(testMarkdown);

console.log('\n=== TEST 2 - Testing image regex on various URLs ===');
const testUrls = [
    'https://pbs.twimg.com/media/HB1CKkbbMAEHwF7?format=jpg&name=small',
    'https://pbs.twimg.com/media/HB1HiOUbkAAhUOr?format=jpg&name=900x900',
    'https://pbs.twimg.com/media/HB1CkUmaoAAuozF?format=jpg',
    'https://pbs.twimg.com/media/test.jpg?name=medium'
];

testUrls.forEach((url, i) => {
    console.log(`\n${i+1}. ${url}`);
    if (url.includes('name=')) {
        const replaced = url.replace(/(name=)(small|medium|900x900)/, '$1large');
        console.log(`   -> ${replaced}`);
    } else {
        let newUrl = url;
        if (!url.includes('?')) {
            newUrl += '?name=large';
        } else {
            newUrl += '&name=large';
        }
        console.log(`   -> ${newUrl}`);
    }
});