/**
 * 本地模拟考前端验收服务。仅托管已有静态产物并模拟公开答题 API，
 * 不连接数据库，也不会调用正式后端。
 *
 * 启动：node scripts/local-mock-exam-server.mjs
 * 页面：http://127.0.0.1:5173/s/mock-exam
 */
import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("../server/api/src/main/resources/static/", import.meta.url)));
const port = Number(process.env.SURVEYKING_MOCK_PORT || 5173);
const projectId = "mock-exam";
const receivedAnswers = [];

const json = (res, body, status = 200) => {
  const text = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" });
  res.end(text);
};

const option = (id, title, correct = false) => ({
  id,
  title,
  type: "Option",
  attribute: correct ? { examCorrectAnswer: "true" } : {}
});

const examSchema = {
  id: projectId,
  title: "模拟考本地测试卷",
  type: "Survey",
  attribute: { display: "visible" },
  children: [
    {
      id: "q-radio",
      title: "单选题：SurveyKing 的本地测试模式是什么？",
      type: "Radio",
      attribute: { examScore: 1, examAnswerMode: "onlyOne", examAnalysis: "选择 A 后确认即可锁定本题。" },
      children: [option("radio-a", "A. 模拟考", true), option("radio-b", "B. 随机问卷")]
    },
    {
      id: "q-checkbox",
      title: "多选题：请选择两个正确选项。",
      type: "Checkbox",
      attribute: { examScore: 2, examAnswerMode: "selectAll", examAnalysis: "A、C 为正确选项。" },
      children: [option("checkbox-a", "A", true), option("checkbox-b", "B"), option("checkbox-c", "C", true)]
    },
    {
      id: "q-judge",
      title: "判断题：确认后不能再次修改。",
      type: "Judge",
      attribute: { examScore: 1, examAnswerMode: "onlyOne", examAnalysis: "本陈述为真。" },
      children: [option("judge-true", "正确", true), option("judge-false", "错误")]
    },
    {
      id: "q-fill",
      title: "填空题：请输入 mock。",
      type: "FillBlank",
      attribute: { examScore: 1, examAnswerMode: "selectAll", examMatchRule: "completeSame", examAnalysis: "答案为 mock。" },
      children: [{ id: "q-fill-answer", title: "", attribute: { examCorrectAnswer: "mock" } }]
    }
  ]
};

const project = {
  id: projectId,
  name: "本地模拟考测试",
  mode: "exam",
  status: 1,
  passwordRequired: false,
  loginRequired: false,
  setting: {
    answerSetting: { questionNumber: true, onePageOneQuestion: false, answerSheetVisible: true, copyEnabled: true },
    submittedSetting: { answerAnalysis: true },
    examSetting: { mockExamMode: true, exerciseMode: false, randomSurveyWrong: false }
  },
  survey: examSchema,
  answer: undefined,
  answerId: undefined,
  examInfo: undefined
};

const bodyOf = req => new Promise((resolve, reject) => {
  let data = "";
  req.on("data", chunk => { data += chunk; });
  req.on("end", () => {
    try { resolve(data ? JSON.parse(data) : {}); } catch (error) { reject(error); }
  });
  req.on("error", reject);
});

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" });
    res.end();
    return;
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === "/api/system") return json(res, { code: 200, success: true, data: { version: "local-mock" } });
    if (req.method === "POST" && url.pathname === "/api/public/loadProject") {
      console.log(`[loadProject] ${req.headers.origin || "same-origin"}`);
      return json(res, { code: 200, success: true, data: project });
    }
    if (req.method === "POST" && url.pathname === "/api/public/validateProject") {
      console.log(`[validateProject] ${req.headers.origin || "same-origin"}`);
      return json(res, { code: 200, success: true, data: project });
    }
    if (req.method === "POST" && url.pathname === "/api/public/saveAnswer") {
      const body = await bodyOf(req);
      receivedAnswers.push(body);
      console.log(`[saveAnswer] ${JSON.stringify(body)}`);
      return json(res, { code: 200, success: true, data: { answerId: "mock-answer-1", examScore: 5 } });
    }
    if (req.method === "POST" && url.pathname === "/api/public/loadStatistics") return json(res, { code: 200, success: true, data: {} });
    if (url.pathname === "/__mock/state") return json(res, { code: 200, receivedAnswers });

    const relative = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    const file = relative && existsSync(path.join(root, relative)) ? path.join(root, relative) : path.join(root, "index.html");
    const ext = path.extname(file);
    const contentType = ext === ".html" ? "text/html; charset=utf-8" : ext === ".js" ? "text/javascript; charset=utf-8" : ext === ".css" ? "text/css; charset=utf-8" : "application/octet-stream";
    res.writeHead(200, { "content-type": contentType });
    res.end(readFileSync(file));
  } catch (error) {
    json(res, { code: 500, success: false, message: String(error) }, 500);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`SurveyKing local mock exam server listening at http://127.0.0.1:${port}/s/${projectId}`);
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
