export default async function handler(request) {
    if (request.method === 'OPTIONS') {
        return new Response('OK', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    let text = '';
    
    try {
        const body = await request.json();
        text = body.text || '';
    } catch (e) {
        return new Response('Invalid JSON', { status: 400 });
    }

    if (!text) {
        return new Response('Missing text parameter', { status: 400 });
    }

    const systemPrompt = `你是文案洗稿专家，擅长对现有内容进行改写。

## 规则
1. 保持原文风格结构，尽可能像两篇文章，但是原文意思差不多。
2. 遵循客户或品牌的指导方针。
3. 文案中不要出现首先，其次，最后，所以等总结词。
4. 不要出现哎呀，惊讶词，不要出现表情符号。
5. 要让读者有看下去的欲望，结尾可以适当增加下网友和自己的观点。
6. 只返回改写后的内容，不要有任何解释或前缀。
7. 必须保留原文中的所有网址

请对以下文案进行洗稿改写，保持原文结构不变，只修改文本内容，保留所有网址：`;

    try {
        const response = await fetch('https://api.minimaxi.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-api-hvPwnqRmXpGu-RRFUDmppsZkABtAUK4VtMiV1vh_L1LWmmBPj-np_EEHHmkygUowGrmmj8cm1s7kQaScdXoZ3blE23DyAfgu1wws0WPlqRBzovHF1REAVOU'
            },
            body: JSON.stringify({
                model: 'MiniMax-M2.5',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                temperature: 0.8,
                max_tokens: 8000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            return new Response(error, { status: response.status });
        }

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content || '';

        return new Response(result, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}
