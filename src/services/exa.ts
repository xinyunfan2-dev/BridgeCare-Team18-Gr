// 定义返回的资源结构，方便前端渲染卡片
export interface ExaResource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  category: string;
}

/**
 * 根据福利类型搜索实时资源（办事处地址、申请表等）
 * @param welfareType 福利名称，例如 "高額長者生活津貼" 或 "綜援"
 */
export async function searchWelfareResources(welfareType: string): Promise<ExaResource[]> {
  const apiKey = import.meta.env.VITE_EXA_API_KEY;
  
  // 如果没有配置 Key，返回空数组并报错
  if (!apiKey) {
    console.error("Exa API Key is missing. Please set VITE_EXA_API_KEY.");
    return [];
  }

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        // 这里的 Prompt 专门为香港政府福利优化
        query: `Official application guide and office locations for ${welfareType} Hong Kong Social Welfare Department`,
        type: "auto",
        numResults: 3,
        contents: {
          highlights: {
            max_characters: 200 // 摘要长度，适合放在卡片里
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Exa API Error: ${response.statusText}`);
    }

    const data = await response.json();

    // 将 Exa 的原始数据映射到我们前端卡片需要的格式
    return data.results.map((res: any) => ({
      id: res.id,
      title: res.title || `${welfareType} 相关资讯`,
      url: res.url,
      snippet: res.highlights?.[0] || "点击查看官方申请详情及办事处地址。",
      category: welfareType
    }));

  } catch (error) {
    console.error("Exa Search Failed:", error);
    return [];
  }
}