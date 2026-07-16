// @ts-ignore
import htmlContent from './index.html';
// @ts-ignore
import cssContent from './style.css';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. トップ画面の表示
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(htmlContent, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 2. CSSの表示
    if (url.pathname === "/style.css") {
      return new Response(cssContent, {
        headers: { "Content-Type": "text/css; charset=utf-8" }
      });
    }

    // 3. データ送信（/submit）の処理
    if (url.pathname === "/submit" && request.method === "POST") {
      try {
        const data = await request.request ? await request.json() : await request.json();
        
        // D1へ保存を実行
        await env.test.prepare(
          "INSERT INTO surveys (name, grade, q1, q2, q3, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(
          data.name, 
          data.grade, 
          data.q1_answer, // カンマ区切りの文字列がそのまま入ります
          data.q2_answer, // カンマ区切りの文字列がそのまま入ります
          data.q3_answer, // ラジオボタンの文字列が入ります
          data.timestamp
        )
        .run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
