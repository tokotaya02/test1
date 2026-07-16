// @ts-ignore
import htmlContent from './index.html';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. トップ画面（実験システム）の表示
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(htmlContent, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 3. データ送信（/submit）の処理
    if (url.pathname === "/submit" && request.method === "POST") {
      try {
        const data = await request.json();
        const timestamp = new Date().toISOString();

        // data.results は10問分の配列。それらをループしてINSERT文を10個作成する
        const stmts = data.results.map(res => {
          return env.test.prepare(`
            INSERT INTO experiment_results (
              subject_id, condition_group, question_number, theme, 
              correct_answer, subject_selection, is_correct, reaction_time_ms, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            data.subjectId,
            data.conditionGroup,
            res.qNum,
            res.theme,
            res.correctWord,
            res.subjectAnswer,
            res.isCorrect ? 1 : 0, // SQLiteでは true/false を 1/0 で保存
            res.timeMs,
            timestamp
          );
        });

        // env.test に対してバッチ処理（一括保存）を実行
        await env.test.batch(stmts);

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
