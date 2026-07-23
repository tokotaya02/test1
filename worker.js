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

        // timestampを削除し、CSVと同じ8項目のINSERT文にする
        const stmts = data.results.map(res => {
          return env.test.prepare(`
            INSERT INTO experiment_results (
              subject_id, condition_group, question_number, theme, 
              correct_answer, subject_selection, is_correct, reaction_time_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            data.subjectId,
            data.conditionGroup,
            res.qNum,
            res.theme,
            res.isCorrect ? 1 : 0, 
            res.timeMs / 1000
          );
        });

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
