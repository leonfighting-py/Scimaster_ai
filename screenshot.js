import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function takeScreenshots() {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  try {
    const page = await browser.newPage();
    
    // 访问页面
    console.log('访问 http://localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // 等待页面加载完成
    await page.waitForTimeout(2000);
    
    // 截取初始页面
    console.log('截取初始页面...');
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', 'initial_page.png'),
      fullPage: true 
    });
    console.log('✓ 初始页面截图已保存到: screenshots/initial_page.png');
    
    // 查找并点击 Start 按钮
    console.log('查找 Start 按钮...');
    
    // 尝试多种可能的选择器
    const selectors = [
      'button:has-text("Start writing")',
      'button:has-text("Start Brainstorming")',
      'div:has-text("Start Writing")',
      'div:has-text("Start Brainstorming")',
      '[class*="card"]',
    ];
    
    let clicked = false;
    
    // 先尝试查找卡片元素
    const cards = await page.$$('div[class*="card"], div[class*="Card"]');
    if (cards.length > 0) {
      console.log(`找到 ${cards.length} 个卡片元素，点击第一个...`);
      await cards[0].click();
      clicked = true;
    } else {
      // 尝试通过文本查找
      const elements = await page.$$('div, button');
      for (const element of elements) {
        const text = await page.evaluate(el => el.textContent, element);
        if (text && (text.includes('Start Writing') || text.includes('Start Brainstorming') || text.includes('Start'))) {
          console.log(`找到包含 "Start" 的元素: ${text.substring(0, 50)}...`);
          await element.click();
          clicked = true;
          break;
        }
      }
    }
    
    if (!clicked) {
      console.log('未找到 Start 按钮，尝试点击页面中心的任何可点击元素...');
      await page.mouse.click(960, 600);
    }
    
    // 等待页面响应
    await page.waitForTimeout(3000);
    
    // 截取点击后的页面
    console.log('截取点击后的页面...');
    await page.screenshot({ 
      path: join(__dirname, 'screenshots', 'after_click.png'),
      fullPage: true 
    });
    console.log('✓ 点击后页面截图已保存到: screenshots/after_click.png');
    
    // 获取页面信息
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.innerText.substring(0, 500)
      };
    });
    
    console.log('\n页面信息:');
    console.log('标题:', pageInfo.title);
    console.log('URL:', pageInfo.url);
    console.log('内容预览:', pageInfo.bodyText);
    
  } catch (error) {
    console.error('错误:', error.message);
    throw error;
  } finally {
    await browser.close();
    console.log('\n浏览器已关闭');
  }
}

// 创建截图目录
import { mkdirSync } from 'fs';
import { existsSync } from 'fs';

const screenshotsDir = join(dirname(fileURLToPath(import.meta.url)), 'screenshots');
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

takeScreenshots().catch(console.error);
