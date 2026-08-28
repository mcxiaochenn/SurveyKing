/**
 * SurveyKing 模拟考模式静态补丁（v1）。
 *
 * 这些文件是生产环境的压缩 Umi bundle，仓库当前没有对应的前端源码：
 * - p__survey__Setting：考试设置页；
 * - p__Answer：公开答题页及 sessionStorage 会话桥接；
 * - 8068：Formily 答题 Store、判题和交卷拦截核心；
 * - 1004/3428/778：PC、移动端题目渲染及确认按钮；
 * - umi：locale、chunk 哈希映射和入口运行时。
 *
 * 脚本只接受下面记录的基线，所有锚点都校验出现次数，全部替换和
 * node --check 通过后才生成新哈希文件。再次执行时只做一致性校验。
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const staticDir = path.resolve(fileURLToPath(new URL("../server/api/src/main/resources/static/", import.meta.url)));
const marker = "/* surveyking-mock-exam-patch:v1 */";
const resultMarker = "/* surveyking-mock-exam-result:v2 */";
const lockMarker = "/* surveyking-mock-exam-lock:v3 */";
const mockSwitch = '(0,k.jsx)(le.rs,{name:"mockExamMode",title:ge.formatMessage({id:"pages.survey.setting.exam.mockExamMode.title",defaultMessage:"模拟考模式"}),tooltip:ge.formatMessage({id:"pages.survey.setting.exam.mockExamMode.tooltip",defaultMessage:"作答后需点击确认答案，确认后显示正误、正确答案与解析，并且不能再次修改。"})})';
const settingDelimiter = '),(0,k.jsx)(le.rs,{name:"randomSurveyWrong"';
const brokenSettingAnchor = `,${mockSwitch}${settingDelimiter}`;
const fixedSettingAnchor = `),${mockSwitch},(0,k.jsx)(le.rs,{name:"randomSurveyWrong"`;
const baseline = {
  "p__survey__Setting.2fa0838a.async.js": "a5ad88d4e34d880ba0cbe7724f70072f3c55c5594a842c2d22172d5cc921cf3c",
  "p__Answer.56f145bb.async.js": "c5242f818fd8b59fed35ca5ca87d0616ec450672e603b99a1e25390394352518",
  "8068.195ecc51.async.js": "cde3d87458c4f0a5724d99d407ce6d612c5997fe4d4c539093b9956e0bb5f481",
  "1004.06dee260.async.js": "219c13a17ace819b653322c7a8692d202a3bf4c3018caa997e34602cfcff9b5e",
  "3428.67a0426c.async.js": "3caddd1272f58abaf45eaefa5ca79333a3e082a8ce2abf5afd1a5e44b18fd541",
  "778.464a191a.async.js": "44c4c1e10eb6c28fd5a341eeeee03d8ec2baedceac5d74121dad4f1f21bf62d0",
  "umi.c1ebddb4.js": "0bcd4dc5b5a22c1eecd674e83bd24533b020c5f0f44d26a1f85edf22bb9961f2",
  "index.html": "9c97525034ed6148fd6f4b9f3ecb695cc7c7d887eb14a8f1042c12d36c219ced",
  "asset-manifest.json": "5b10c6723ebc2bb70ae4cfe51d14aab9b2619ce760b13996b37881f0ee956033"
};

const sha256 = value => createHash("sha256").update(value).digest("hex");
const count = (value, needle) => value.split(needle).length - 1;
const replaceOnce = (value, needle, replacement, label = needle) => {
  const occurrences = count(value, needle);
  if (occurrences !== 1) throw new Error(`${label} 预期出现 1 次，实际 ${occurrences} 次`);
  return value.replace(needle, replacement);
};
const replaceNth = (value, needle, replacement, nth, label = needle) => {
  const occurrences = count(value, needle);
  if (occurrences < nth) throw new Error(`${label} 至少需要出现 ${nth} 次，实际 ${occurrences} 次`);
  let offset = -1;
  for (let i = 0; i < nth; i++) offset = value.indexOf(needle, offset + 1);
  return `${value.slice(0, offset)}${replacement}${value.slice(offset + needle.length)}`;
};
const replaceRegexOnce = (value, regex, replacement, label) => {
  const matches = value.match(regex) || [];
  if (matches.length !== 1) throw new Error(`${label} 预期匹配 1 次，实际 ${matches.length} 次`);
  return value.replace(regex, replacement);
};
const read = name => readFileSync(path.join(staticDir, name), "utf8");
const assertBaseline = () => Object.entries(baseline).forEach(([name, expected]) => {
  const file = path.join(staticDir, name);
  if (!existsSync(file)) throw new Error(`缺少基线文件：${name}`);
  const actual = sha256(readFileSync(file));
  if (actual !== expected) throw new Error(`${name} 基线哈希不匹配：${actual}`);
});
const findPatchedUmi = () => readdirSync(staticDir).find(name => /^umi\.[0-9a-f]{8}\.js$/.test(name) && read(name).includes(marker));
const checkJs = names => names.forEach(name => execFileSync(process.execPath, ["--check", path.join(staticDir, name)], { stdio: "inherit" }));
const checkSource = (source, label) => execFileSync(process.execPath, ["--check", "-"], { input: source, stdio: ["pipe", "inherit", "inherit"] });
const addMarker = source => `${marker}\n${source}`;

function patchSetting(source) {
  const start = source.indexOf('(0,k.jsx)(le.rs,{name:"exerciseMode"');
  const end = source.indexOf(settingDelimiter, start);
  if (start < 0 || end < 0 || end <= start) throw new Error("设置页 exerciseMode 锚点缺失");
  source = replaceOnce(source, settingDelimiter, `),${mockSwitch},(0,k.jsx)(le.rs,{name:"randomSurveyWrong"`, "设置页模拟考开关");
  source = replaceOnce(source,
    '$t==="examSetting.randomSurveyWrong"&&Rn===!0&&(un("examSetting.exerciseMode",!0),un("examSetting.randomSurvey",void 0)),',
    '$t==="examSetting.mockExamMode"&&Rn===!0&&(un("examSetting.exerciseMode",!1),un("examSetting.randomSurveyWrong",!1)),$t==="examSetting.exerciseMode"&&Rn===!0&&un("examSetting.mockExamMode",!1),$t==="examSetting.exerciseMode"&&Rn===!1&&un("examSetting.randomSurveyWrong",!1),$t==="examSetting.randomSurveyWrong"&&Rn===!0&&(un("examSetting.exerciseMode",!0),un("examSetting.mockExamMode",!1),un("examSetting.randomSurvey",void 0)),',
    "设置页考试模式互斥 effects");
  return addMarker(source);
}

function patchCore(source) {
  source = replaceOnce(source, "this.reviewAnswer={},this.autoNextPage", "this.reviewAnswer={},this.confirmedQuestionIds={},this.autoNextPage", "Store 会话确认状态");
  source = replaceOnce(source, "this.props.exerciseMode&&this.computeReviewAnswer(n.componentProps.schema,n.value)", "(this.props.exerciseMode||this.props.mockExamMode)&&this.computeReviewAnswer(n.componentProps.schema,n.value)", "Store 模拟考字段变化判题");
  source = replaceOnce(source, '(f==="Radio"||f==="Judge")&&(o.visible=!0)', '(f==="Radio"||f==="Judge")&&!this.props.mockExamMode&&(o.visible=!0)', "Store 模拟考延迟显示结果");
  source = replaceOnce(source,
    "props:y.LO.shallow,answerSheet:y.LO,answerSheetVisible:y.LO.ref,reviewAnswer:y.LO,notNoneInQuestionGroup:y.LO,schema:y.LO.computed,autoNextPage:y.LO.ref,hiddenOption:y.LO.shallow,exerciseMode:y.LO.computed,lazy:y.LO.ref,visibleId:y.LO.ref,computeProgress:y.aD",
    "props:y.LO.shallow,answerSheet:y.LO,answerSheetVisible:y.LO.ref,reviewAnswer:y.LO,confirmedQuestionIds:y.LO,notNoneInQuestionGroup:y.LO,schema:y.LO.computed,autoNextPage:y.LO.ref,hiddenOption:y.LO.shallow,exerciseMode:y.LO.computed,lazy:y.LO.ref,visibleId:y.LO.ref,computeProgress:y.aD",
    "Store confirmedQuestionIds observable");
  source = replaceOnce(source, "changePageIndex:y.aD,handleFieldValueChange:y.aD,computeReviewAnswer:y.aD,reOrder:y.aD", "changePageIndex:y.aD,handleFieldValueChange:y.aD,computeReviewAnswer:y.aD,findQuestionSchema:y.aD,lockQuestion:y.aD,canConfirm:y.aD,confirmAnswer:y.aD,validateMockConfirm:y.aD,reOrder:y.aD", "Store 模拟考方法 observable");
  const restoreNeedle = "this.makeObservable(),this.props.correctAnswerVisible&&n&&(0,$.Xn)(o).forEach(function(g){r.computeReviewAnswer(g,n[g.id]).then(function(h){h&&(r.reviewAnswer[g.id].visible=!0)})})";
  const restoreReplacement = "this.makeObservable(),this.confirmedQuestionIds=Object.assign({},this.props.confirmedQuestionIds||{}),this.props.mockExamMode&&Object.keys(this.confirmedQuestionIds).forEach(function(g){var h=r.findQuestionSchema(g),d=n&&n[g];h&&r.computeReviewAnswer(h,d).then(function(){r.reviewAnswer[g]&&(r.reviewAnswer[g].visible=!0,r.lockQuestion(g))})}),this.props.correctAnswerVisible&&n&&(0,$.Xn)(o).forEach(function(g){r.computeReviewAnswer(g,n[g.id]).then(function(h){h&&(r.reviewAnswer[g.id].visible=!0)})})";
  source = replaceOnce(source, restoreNeedle, restoreReplacement, "Store 恢复已确认题");
  const methodsNeedle = "},{key:\"markQuestion\",value:function(r){";
  const methods = "},{key:\"findQuestionSchema\",value:function(r){var i=null;return function n(t){if(!t||i)return;t.id===r&&(i=t),t.children&&t.children.forEach(n)}(this.schema),i}},{key:\"lockQuestion\",value:function(r){this.form&&this.form.setFieldState(r,function(i){i.pattern=\"readPretty\",i.editable=!1})}},{key:\"canConfirm\",value:function(r){var i=this.findQuestionSchema(r),n=this.form&&this.form.query(r).take(),t=this.reviewAnswer[r];return!!(this.props.mockExamMode&&i&&[\"FillBlank\",\"MultipleBlank\",\"HorzBlank\",\"Radio\",\"Checkbox\",\"Judge\"].includes(i.type)&&n&&!(0,$.xb)(n.value)&&!this.confirmedQuestionIds[r]&&t)}},{key:\"confirmAnswer\",value:function(r){var i=this;if(!this.canConfirm(r))return;var n=this.form.query(r).take(),t=this.findQuestionSchema(r);return this.computeReviewAnswer(t,n.value).then(function(){var a=i.reviewAnswer[r];a&&(a.visible=!0,i.confirmedQuestionIds[r]=!0,i.lockQuestion(r),i.form.setFieldState(r,function(o){o.errors=[]}),i.props.onMockConfirm&&i.props.onMockConfirm(r,(0,y.ZN)(n.value)))})}},{key:\"validateMockConfirm\",value:function(){var r=this;if(!this.props.mockExamMode)return null;var i=null;return function n(t){if(!t||i)return;var a=r.form&&r.form.query(t.id).take(),s=t.attribute||{};a&&a.get&&a.get(\"display\")===\"none\"||!a||s.display===\"hidden\"||s.examAnswerMode===\"none\"||!(0,$.xb)(a.value)&&!r.confirmedQuestionIds[t.id]&&[\"FillBlank\",\"MultipleBlank\",\"HorzBlank\",\"Radio\",\"Checkbox\",\"Judge\"].includes(t.type)&&(i=t.id),t.children&&t.children.forEach(n)}(this.schema),i}},{key:\"markQuestion\",value:function(r){";
  source = replaceOnce(source, methodsNeedle, methods, "Store 模拟考方法");
  source = replaceOnce(source, "case 0:n=\"\",t=this.form.query(\"*\").map()", "case 0:if(this.props.mockExamMode){var mockPendingQuestion=this.validateMockConfirm();if(mockPendingQuestion)return this.form.setFieldState(mockPendingQuestion,function(i){i.errors=[\"请先确认本题答案\"]}),this.changePageIndex(mockPendingQuestion),d.abrupt(\"return\")}n=\"\",t=this.form.query(\"*\").map()", "Store 交卷前模拟考拦截");
  return addMarker(source);
}

function patchAnswer(source) {
  const helperNeedle = 'we=(0,J.Pi)(function(){';
  const helper = 'mockReadSession=function(r,i,n){try{var t=sessionStorage.getItem(r);if(!t)return{version:1,projectId:i,confirmedAnswers:{}};var a=JSON.parse(t);return a&&a.version===1&&a.projectId===i&&a.confirmedAnswers&&typeof a.confirmedAnswers==="object"?a:(sessionStorage.removeItem(r),{version:1,projectId:i,confirmedAnswers:{}})}catch(e){try{sessionStorage.removeItem(r)}catch(o){}return{version:1,projectId:i,confirmedAnswers:{}}}},mockWriteSession=function(r,i,n,t,a){try{n[t]={value:a},sessionStorage.setItem(r,JSON.stringify({version:1,projectId:i,confirmedAnswers:n}))}catch(e){}},mockRemoveSession=function(r){try{sessionStorage.removeItem(r)}catch(e){}},we=(0,J.Pi)(function(){';
  source = replaceOnce(source, helperNeedle, helper, "答题页 sessionStorage helper");
  const stateNeedle = 'ie=a.success,oe=(0,w.XO)(E,g);';
  const stateReplacement = 'ie=a.success,oe=(0,w.XO)(E,g),mockMode=re==="exam"&&!!ne.mockExamMode&&!Ze&&k!=="readPretty",mockKey="surveyking:mock-exam:v1:".concat(L,":").concat(te||"new").concat(A?":preview":""),mockSession=mockReadSession(mockKey,L,A),mockConfirmed=mockSession.confirmedAnswers||{},mockInitialValues=Object.keys(mockConfirmed).reduce(function(x,q){return x[q]=mockConfirmed[q].value,x},{});';
  source = replaceOnce(source, stateNeedle, stateReplacement, "答题页模拟考状态");
  const propsNeedle = 'exerciseMode:Ze,wrongMode:be,pattern:k,triggerType:Se';
  const propsReplacement = 'exerciseMode:Ze,mockExamMode:mockMode,confirmedQuestionIds:mockConfirmed,mockConfirmText:i.formatMessage({id:"pages.answer.mockExam.confirm",defaultMessage:"确认答案"}),mockConfirmRequiredText:i.formatMessage({id:"pages.answer.mockExam.required",defaultMessage:"请先确认本题答案"}),onMockConfirm:function(q,v){mockWriteSession(mockKey,L,mockConfirmed,q,v)},wrongMode:be,pattern:k,triggerType:Se';
  source = replaceOnce(source, propsNeedle, propsReplacement, "答题页 Store 模拟考 props");
  source = replaceOnce(source, '),oe),a.values),statistics:Ee', '),oe),a.values,mockInitialValues),statistics:Ee', "答题页恢复已确认答案");
  source = replaceOnce(source, 'then(function(s){!(s!=null&&s.success)&&s!==null&&s!==void 0&&s.message&&', 'then(function(s){s!=null&&s.success&&mockMode&&mockRemoveSession(mockKey),!(s!=null&&s.success)&&s!==null&&s!==void 0&&s.message&&', "答题页成功提交清理会话");
  if (source.includes("mockRemoveSession=function(r){try{sessionStorage.removeItem(r)}catch(e){}};we=")) throw new Error("答题页 sessionStorage helper 变量链被分号截断");
  return addMarker(source);
}

function reviewButtonV1(mobile, storeVar = "n", reviewVar = mobile ? "t" : "i", questionVar = "r.qId", buttonVar = "R.Z", jsxVar = "e") {
  const old = mobile
    ? `${reviewVar}&&!${reviewVar}.visible&&(!${storeVar}.props||!${storeVar}.props.mockExamMode||${storeVar}.canConfirm(${questionVar}))?(0,${jsxVar}.jsx)(${buttonVar},{block:!0,ghost:!0,className:"review-answer-btn",style:{marginTop:10},onClick:function(){${reviewVar}.visible=!0},children:"\\u67E5\\u770B\\u7B54\\u6848"})`
    : 'i&&!i.visible&&(!n.props||!n.props.mockExamMode||n.canConfirm(t.qId))?(0,e.jsx)("span",{className:"review-answer-btn",onClick:function(){i.visible=!0},children:"\\u67E5\\u770B\\u7B54\\u6848"})';
  return mobile
    ? `${reviewVar}&&!${reviewVar}.visible&&(!${storeVar}.props||!${storeVar}.props.mockExamMode||${storeVar}.canConfirm(${questionVar}))?(0,${jsxVar}.jsx)(${buttonVar},{block:!0,ghost:!0,className:"review-answer-btn",style:{marginTop:10},onClick:function(){${storeVar}.props&&${storeVar}.props.mockExamMode?${storeVar}.confirmAnswer(${questionVar}):${reviewVar}.visible=!0},children:${storeVar}.props&&${storeVar}.props.mockExamMode?"确认答案":"\\u67E5\\u770B\\u7B54\\u6848"})`
    : 'i&&!i.visible&&(!n.props||!n.props.mockExamMode||n.canConfirm(t.qId))?(0,e.jsx)("span",{className:"review-answer-btn",onClick:function(){n.props&&n.props.mockExamMode?n.confirmAnswer(t.qId):i.visible=!0},children:n.props&&n.props.mockExamMode?"确认答案":"\\u67E5\\u770B\\u7B54\\u6848"})';
}

function patchReviewButton(source, mobile, storeVar = "n", reviewVar = mobile ? "t" : "i", questionVar = "r.qId", buttonVar = "R.Z", jsxVar = "e") {
  const old = mobile
    ? `${reviewVar}&&!${reviewVar}.visible&&(!${storeVar}.props||!${storeVar}.props.mockExamMode||${storeVar}.canConfirm(${questionVar}))?(0,${jsxVar}.jsx)(${buttonVar},{block:!0,ghost:!0,className:"review-answer-btn",style:{marginTop:10},onClick:function(){${reviewVar}.visible=!0},children:"\\u67E5\\u770B\\u7B54\\u6848"})`
    : 'i&&!i.visible&&(!n.props||!n.props.mockExamMode||n.canConfirm(t.qId))?(0,e.jsx)("span",{className:"review-answer-btn",onClick:function(){i.visible=!0},children:"\\u67E5\\u770B\\u7B54\\u6848"})';
  return replaceOnce(source, old, reviewButtonV1(mobile, storeVar, reviewVar, questionVar, buttonVar, jsxVar), `${mobile ? "移动" : "PC"}确认按钮`);
}

function patchReviewResult(source, mobile, storeVar = "n", reviewVar = mobile ? "t" : "i", questionVar = "r.qId", buttonVar = "R.Z", jsxVar = "e") {
  const reviewButton = reviewButtonV1(mobile, storeVar, reviewVar, questionVar, buttonVar, jsxVar);
  const resultCorrect = `Object.keys(${reviewVar}).filter(function(r){return r!=="visible"}).every(function(r){var a=${reviewVar}[r];return!!a.isCorrect===!!a.selected})`;
  const result = mobile
    ? `${reviewVar}?${reviewVar}.visible&&${storeVar}.props&&${storeVar}.props.mockExamMode?(0,${jsxVar}.jsx)("span",{className:"review-answer-btn",style:{marginTop:10,cursor:"default",color:${resultCorrect}?"#00bf6f":"#ff6d56"},children:${resultCorrect}?"回答正确":"回答错误（绿色选项为正确答案）"}):${reviewButton}:(0,${jsxVar}.jsx)(${jsxVar}.Fragment,{})`
    : `${reviewVar}?${reviewVar}.visible&&${storeVar}.props&&${storeVar}.props.mockExamMode?(0,${jsxVar}.jsx)("span",{className:"review-answer-btn",style:{cursor:"default",color:${resultCorrect}?"#00bf6f":"#ff6d56"},children:${resultCorrect}?"回答正确":"回答错误（绿色选项为正确答案）"}):${reviewButton}:(0,${jsxVar}.jsx)(${jsxVar}.Fragment,{})`;
  return `${resultMarker}\n${replaceOnce(source, reviewButton, result, `${mobile ? "移动" : "PC"}模拟考确认结果`)}`;
}

function patchUmi(source) {
  source = replaceNth(source, '"pages.survey.setting.exam.maxSubmit.title"', '"pages.survey.setting.exam.mockExamMode.title":"Mock exam mode","pages.survey.setting.exam.mockExamMode.tooltip":"After answering a question, click Confirm answer to show correctness, the correct answer and explanation. The answer cannot be changed after confirmation.","pages.survey.setting.exam.maxSubmit.title"', 1, "英文模拟考 locale");
  source = replaceNth(source, '"pages.survey.setting.exam.maxSubmit.title"', '"pages.survey.setting.exam.mockExamMode.title":"模拟考模式","pages.survey.setting.exam.mockExamMode.tooltip":"作答后需点击确认答案，确认后显示正误、正确答案与解析，并且不能再次修改。","pages.survey.setting.exam.maxSubmit.title"', 2, "中文模拟考 locale");
  for (const [id, oldHash] of [["1117", "2fa0838a"], ["6637", "56f145bb"], ["8068", "195ecc51"], ["1004", "06dee260"], ["3428", "67a0426c"], ["778", "464a191a"]]) {
    const next = `__MOCK_HASH_${id}__`;
    source = replaceOnce(source, `"${id}":"${oldHash}"`, `"${id}":"${next}"`, `umi chunk ${id}`);
  }
  return addMarker(source);
}

function renameWithHash(originalName, content) {
  const ext = originalName.endsWith(".async.js") ? ".async.js" : ".js";
  const base = originalName.slice(0, -ext.length).replace(/\.[0-9a-f]{8}$/, "");
  return `${base}.${sha256(content).slice(0, 8)}${ext}`;
}

function repairBrokenSettingBundle(patchedUmi) {
  const names = readdirSync(staticDir).filter(name => name.endsWith(".js"));
  const settingName = names.find(name => name.startsWith("p__survey__Setting.") && name.endsWith(".async.js") && read(name).includes(marker));
  if (!settingName) throw new Error("缺少已补丁的设置页 bundle");
  const setting = read(settingName);
  if (setting.includes(fixedSettingAnchor)) return patchedUmi;
  if (!setting.includes(brokenSettingAnchor)) throw new Error("设置页模拟考开关结构未知，拒绝自动修复");

  const repairedSetting = replaceOnce(setting, brokenSettingAnchor, fixedSettingAnchor, "修复设置页模拟考开关参数位置");
  checkSource(repairedSetting, "设置页 bundle");
  const nextSettingName = renameWithHash(settingName, repairedSetting);
  const oldSettingHash = settingName.match(/\.([0-9a-f]{8})\.async\.js$/)[1];
  const nextSettingHash = nextSettingName.match(/\.([0-9a-f]{8})\.async\.js$/)[1];

  let umi = read(patchedUmi);
  umi = replaceOnce(umi, `"1117":"${oldSettingHash}"`, `"1117":"${nextSettingHash}"`, "更新设置页 chunk 哈希");
  checkSource(umi, "Umi runtime");
  const nextUmiName = renameWithHash(patchedUmi, umi);

  let index = read("index.html");
  index = replaceOnce(index, `/${patchedUmi}`, `/${nextUmiName}`, "更新 index Umi 引用");
  const manifest = JSON.parse(read("asset-manifest.json"));
  const renamedManifest = Object.fromEntries(Object.entries(manifest).map(([key, value]) => {
    const nextKey = key === `/${settingName}` ? `/${nextSettingName}` : key === `/${patchedUmi}` ? `/${nextUmiName}` : key;
    const nextValue = value === `/${settingName}` ? `/${nextSettingName}` : value === `/${patchedUmi}` ? `/${nextUmiName}` : value;
    return [nextKey, nextValue];
  }));
  renamedManifest["/p__survey__Setting.js"] = `/${nextSettingName}`;
  renamedManifest["/umi.js"] = `/${nextUmiName}`;
  const manifestText = `${JSON.stringify(renamedManifest, null, 2)}\n`;
  if (index.includes(patchedUmi) || manifestText.includes(settingName) || manifestText.includes(patchedUmi) || umi.includes(`"1117":"${oldSettingHash}"`)) {
    throw new Error("修复后仍存在旧设置页或 Umi 引用");
  }

  writeFileSync(path.join(staticDir, nextSettingName), repairedSetting);
  writeFileSync(path.join(staticDir, nextUmiName), umi);
  writeFileSync(path.join(staticDir, "index.html"), index);
  writeFileSync(path.join(staticDir, "asset-manifest.json"), manifestText);
  unlinkSync(path.join(staticDir, settingName));
  unlinkSync(path.join(staticDir, patchedUmi));
  console.log(`已修复设置页模拟考开关渲染：${settingName} -> ${nextSettingName}`);
  return nextUmiName;
}

function upgradeConfirmedResult(patchedUmi) {
  const names = readdirSync(staticDir).filter(name => name.endsWith(".js"));
  const bundles = [
    { id: "1004", prefix: "1004", mobile: false, storeVar: "n", reviewVar: "i", questionVar: "t.qId" },
    { id: "3428", prefix: "3428", mobile: true, storeVar: "n", reviewVar: "t", questionVar: "r.qId" },
    { id: "778", prefix: "778", mobile: true, storeVar: "c", reviewVar: "d", questionVar: "C.qId", buttonVar: "ye.Z", jsxVar: "i" }
  ].map(bundle => ({
    ...bundle,
    name: names.find(name => name.startsWith(`${bundle.prefix}.`) && name.endsWith(".async.js") && read(name).includes(marker))
  }));
  if (bundles.some(bundle => !bundle.name)) throw new Error("缺少已补丁的题目渲染 bundle");
  const upgraded = bundles.filter(bundle => read(bundle.name).includes(resultMarker));
  if (upgraded.length === bundles.length) return patchedUmi;
  if (upgraded.length > 0) throw new Error("题目确认结果补丁状态不一致，拒绝生成半成品");

  const changed = bundles.map(bundle => ({
    ...bundle,
    content: patchReviewResult(read(bundle.name), bundle.mobile, bundle.storeVar, bundle.reviewVar, bundle.questionVar, bundle.buttonVar, bundle.jsxVar),
  }));
  changed.forEach(bundle => checkSource(bundle.content, `${bundle.prefix} 确认结果 bundle`));

  const renamed = changed.map(bundle => ({
    ...bundle,
    nextName: renameWithHash(bundle.name, bundle.content)
  }));
  let umi = read(patchedUmi);
  renamed.forEach(bundle => {
    const oldHash = bundle.name.match(/\.([0-9a-f]{8})\.async\.js$/)[1];
    const nextHash = bundle.nextName.match(/\.([0-9a-f]{8})\.async\.js$/)[1];
    umi = replaceOnce(umi, `"${bundle.id}":"${oldHash}"`, `"${bundle.id}":"${nextHash}"`, `更新确认结果 chunk ${bundle.id}`);
  });
  checkSource(umi, "确认结果 Umi runtime");
  const nextUmiName = renameWithHash(patchedUmi, umi);

  let index = read("index.html");
  index = replaceOnce(index, `/${patchedUmi}`, `/${nextUmiName}`, "更新确认结果 Umi 引用");
  const renameMap = Object.fromEntries(renamed.map(bundle => [bundle.name, bundle.nextName]));
  renameMap[patchedUmi] = nextUmiName;
  const manifest = JSON.parse(read("asset-manifest.json"));
  const renamedManifest = Object.fromEntries(Object.entries(manifest).map(([key, value]) => {
    const nextKey = renameMap[key.slice(1)] ? `/${renameMap[key.slice(1)]}` : key;
    const nextValue = typeof value === "string" && renameMap[value.slice(1)] ? `/${renameMap[value.slice(1)]}` : value;
    return [nextKey, nextValue];
  }));
  renamed.forEach(bundle => { renamedManifest[`/${bundle.prefix}.js`] = `/${bundle.nextName}`; });
  renamedManifest["/umi.js"] = `/${nextUmiName}`;
  const manifestText = `${JSON.stringify(renamedManifest, null, 2)}\n`;
  if (index.includes(patchedUmi) || manifestText.includes(patchedUmi) || renamed.some(bundle => manifestText.includes(bundle.name)) || renamed.some(bundle => umi.includes(bundle.name.match(/\.([0-9a-f]{8})\.async\.js$/)[1]))) {
    throw new Error("确认结果升级后仍存在旧静态资源引用");
  }

  renamed.forEach(bundle => writeFileSync(path.join(staticDir, bundle.nextName), bundle.content));
  writeFileSync(path.join(staticDir, nextUmiName), umi);
  writeFileSync(path.join(staticDir, "index.html"), index);
  writeFileSync(path.join(staticDir, "asset-manifest.json"), manifestText);
  renamed.forEach(bundle => unlinkSync(path.join(staticDir, bundle.name)));
  unlinkSync(path.join(staticDir, patchedUmi));
  console.log(`已增加模拟考确认结果文案：${renamed.map(bundle => `${bundle.name} -> ${bundle.nextName}`).join("，")}`);
  return nextUmiName;
}

function patchQuestionLock(source) {
  const oldLock = '},{key:"lockQuestion",value:function(r){this.form&&this.form.setFieldState(r,function(i){i.pattern="readPretty",i.editable=!1})}';
  const nextLock = '},{key:"lockQuestion",value:function(r){this.form&&this.form.setFieldState(r,function(i){i.editable=!1})}';
  return `${lockMarker}\n${replaceOnce(source, oldLock, nextLock, "模拟考锁题保持判题渲染")}`;
}

function upgradeQuestionLock(patchedUmi) {
  const names = readdirSync(staticDir).filter(name => name.endsWith(".js"));
  const coreName = names.find(name => name.startsWith("8068.") && name.endsWith(".async.js") && read(name).includes(marker));
  if (!coreName) throw new Error("缺少已补丁的答题核心 bundle");
  const core = read(coreName);
  if (core.includes(lockMarker)) return patchedUmi;

  const upgradedCore = patchQuestionLock(core);
  checkSource(upgradedCore, "模拟考锁题核心 bundle");
  const nextCoreName = renameWithHash(coreName, upgradedCore);
  const oldHash = coreName.match(/\.([0-9a-f]{8})\.async\.js$/)[1];
  const nextHash = nextCoreName.match(/\.([0-9a-f]{8})\.async\.js$/)[1];
  let umi = read(patchedUmi);
  umi = replaceOnce(umi, `"8068":"${oldHash}"`, `"8068":"${nextHash}"`, "更新锁题核心 chunk");
  checkSource(umi, "模拟考锁题 Umi runtime");
  const nextUmiName = renameWithHash(patchedUmi, umi);

  let index = read("index.html");
  index = replaceOnce(index, `/${patchedUmi}`, `/${nextUmiName}`, "更新锁题 Umi 引用");
  const manifest = JSON.parse(read("asset-manifest.json"));
  const renamedManifest = Object.fromEntries(Object.entries(manifest).map(([key, value]) => {
    const nextKey = key === `/${coreName}` ? `/${nextCoreName}` : key === `/${patchedUmi}` ? `/${nextUmiName}` : key;
    const nextValue = value === `/${coreName}` ? `/${nextCoreName}` : value === `/${patchedUmi}` ? `/${nextUmiName}` : value;
    return [nextKey, nextValue];
  }));
  renamedManifest["/8068.js"] = `/${nextCoreName}`;
  renamedManifest["/umi.js"] = `/${nextUmiName}`;
  const manifestText = `${JSON.stringify(renamedManifest, null, 2)}\n`;
  if (index.includes(patchedUmi) || manifestText.includes(coreName) || manifestText.includes(patchedUmi) || umi.includes(`"8068":"${oldHash}"`)) {
    throw new Error("锁题升级后仍存在旧核心资源引用");
  }

  writeFileSync(path.join(staticDir, nextCoreName), upgradedCore);
  writeFileSync(path.join(staticDir, nextUmiName), umi);
  writeFileSync(path.join(staticDir, "index.html"), index);
  writeFileSync(path.join(staticDir, "asset-manifest.json"), manifestText);
  unlinkSync(path.join(staticDir, coreName));
  unlinkSync(path.join(staticDir, patchedUmi));
  console.log(`已修复模拟考锁题渲染：${coreName} -> ${nextCoreName}`);
  return nextUmiName;
}

function main() {
  let patchedUmi = findPatchedUmi();
  if (patchedUmi) {
    patchedUmi = repairBrokenSettingBundle(patchedUmi);
    patchedUmi = upgradeConfirmedResult(patchedUmi);
    patchedUmi = upgradeQuestionLock(patchedUmi);
    const names = readdirSync(staticDir).filter(name => name.endsWith(".js"));
    checkJs(names);
    const manifest = JSON.parse(read("asset-manifest.json"));
    const required = ["p__survey__Setting", "p__Answer", "8068", "1004", "3428", "778"].map(prefix => names.find(name => name.startsWith(`${prefix}.`) && name.endsWith(".async.js")));
    if (required.some(name => !name || !read(name).includes(marker))) throw new Error("模拟考补丁资源缺少一致性标记");
    const settingName = required[0];
    if (!read(settingName).includes(fixedSettingAnchor) || read(settingName).includes(brokenSettingAnchor)) throw new Error("设置页模拟考开关未作为独立子节点渲染");
    if (required.slice(3).some(name => !read(name).includes(resultMarker))) throw new Error("模拟考确认结果文案补丁缺失");
    if (!read(required[2]).includes(lockMarker)) throw new Error("模拟考锁题渲染补丁缺失");
    if (Object.values(manifest).some(value => typeof value === "string" && /(?:2fa0838a|56f145bb|195ecc51|06dee260|67a0426c|464a191a|c1ebddb4)/.test(value))) throw new Error("manifest 仍引用旧 bundle 哈希");
    console.log(`模拟考静态补丁已存在，完成一致性校验：${patchedUmi}`);
    return;
  }

  assertBaseline();
  const original = {
    setting: "p__survey__Setting.2fa0838a.async.js",
    answer: "p__Answer.56f145bb.async.js",
    core: "8068.195ecc51.async.js",
    pc: "1004.06dee260.async.js",
    tablet: "3428.67a0426c.async.js",
    mobile: "778.464a191a.async.js",
    umi: "umi.c1ebddb4.js"
  };
  const changed = {
    [original.setting]: patchSetting(read(original.setting)),
    [original.answer]: patchAnswer(read(original.answer)),
    [original.core]: patchQuestionLock(patchCore(read(original.core))),
    [original.pc]: addMarker(patchReviewResult(patchReviewButton(read(original.pc), false, "n", "i", "t.qId"), false, "n", "i", "t.qId")),
    [original.tablet]: addMarker(patchReviewResult(patchReviewButton(read(original.tablet), true, "n", "t", "r.qId"), true, "n", "t", "r.qId")),
    [original.mobile]: addMarker(patchReviewResult(patchReviewButton(read(original.mobile), true, "c", "d", "C.qId", "ye.Z", "i"), true, "c", "d", "C.qId", "ye.Z", "i")),
    [original.umi]: patchUmi(read(original.umi))
  };
  const names = Object.keys(changed);
  checkJs(names);

  const newNames = Object.fromEntries(names.map(name => [name, renameWithHash(name, changed[name])]));
  const hashByChunk = { "1117": newNames[original.setting].match(/\.([0-9a-f]{8})\.async\.js$/)[1], "6637": newNames[original.answer].match(/\.([0-9a-f]{8})\.async\.js$/)[1], "8068": newNames[original.core].match(/\.([0-9a-f]{8})\.async\.js$/)[1], "1004": newNames[original.pc].match(/\.([0-9a-f]{8})\.async\.js$/)[1], "3428": newNames[original.tablet].match(/\.([0-9a-f]{8})\.async\.js$/)[1], "778": newNames[original.mobile].match(/\.([0-9a-f]{8})\.async\.js$/)[1] };
  let umi = changed[original.umi];
  for (const [id, hash] of Object.entries(hashByChunk)) umi = replaceOnce(umi, `"${id}":"__MOCK_HASH_${id}__"`, `"${id}":"${hash}"`, `写入 umi chunk ${id}`);
  changed[original.umi] = umi;
  const newUmiName = renameWithHash(original.umi, umi);
  const allNewNames = { ...newNames, [original.umi]: newUmiName };

  let index = read("index.html");
  index = replaceOnce(index, "/umi.c1ebddb4.js", `/${newUmiName}`, "index Umi 引用");
  let manifest = JSON.parse(read("asset-manifest.json"));
  const manifestRename = {
    [original.setting]: allNewNames[original.setting],
    [original.answer]: allNewNames[original.answer],
    [original.core]: allNewNames[original.core],
    [original.pc]: allNewNames[original.pc],
    [original.tablet]: allNewNames[original.tablet],
    [original.mobile]: allNewNames[original.mobile],
    [original.umi]: allNewNames[original.umi]
  };
  manifest = Object.fromEntries(Object.entries(manifest).map(([key, value]) => [manifestRename[key.slice(1)] ? `/${manifestRename[key.slice(1)]}` : key, manifestRename[value?.slice(1)] ? `/${manifestRename[value.slice(1)]}` : value]));
  manifest["/p__survey__Setting.js"] = `/${allNewNames[original.setting]}`;
  manifest["/p__Answer.js"] = `/${allNewNames[original.answer]}`;
  manifest["/umi.js"] = `/${newUmiName}`;
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  if (JSON.stringify(manifest).includes("2fa0838a") || JSON.stringify(manifest).includes("56f145bb") || JSON.stringify(manifest).includes("195ecc51")) throw new Error("manifest 仍含旧 bundle 哈希");

  const generated = { ...changed, [original.umi]: umi };
  for (const [name, content] of Object.entries(generated)) writeFileSync(path.join(staticDir, allNewNames[name]), content);
  writeFileSync(path.join(staticDir, newUmiName), umi);
  writeFileSync(path.join(staticDir, "index.html"), index);
  writeFileSync(path.join(staticDir, "asset-manifest.json"), manifestText);
  for (const name of names) unlinkSync(path.join(staticDir, name));
  console.log(`模拟考静态补丁完成：${JSON.stringify(allNewNames)}`);
}

main();
