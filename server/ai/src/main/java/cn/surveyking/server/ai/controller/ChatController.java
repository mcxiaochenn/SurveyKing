package cn.surveyking.server.ai.controller;

import cn.surveyking.server.ai.domain.ChatRequest;
import cn.surveyking.server.ai.domain.ConversationRequest;
import cn.surveyking.server.ai.domain.ConversationResponse;
import cn.surveyking.server.ai.domain.EventTypeEnum;
import cn.surveyking.server.ai.domain.ModelType;
import cn.surveyking.server.ai.domain.StreamResponseEvent;
import cn.surveyking.server.ai.service.ChatService;
import cn.surveyking.server.ai.service.ConversationCacheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("${api.prefix}/ai/chat")
public class ChatController {

    private static final String ANSWER_ANALYSIS_SYSTEM_PROMPT = String.join("\n",
            "你是一名严谨的考试讲解老师。",
            "你的任务是根据用户提供的题目、选项和标准答案生成答案解析。",
            "输出要求：",
            "1. 使用简体中文。",
            "2. 先直接给出正确答案。",
            "3. 再解释考点、解题思路和判断依据。",
            "4. 如果是选择题，简要说明错误选项为什么不对。",
            "5. 直接输出解析正文，不要输出寒暄、提示词复述或 Markdown 标题。");

    @Autowired
    private ChatService chatService;

    @Autowired
    private ConversationCacheService conversationCacheService;

    @GetMapping("/models")
    public List<ModelType> getModels() {
        return chatService.getAllModelTypes();
    }

    @PostMapping("/create-conversation")
    public ConversationResponse createConversation(
            @RequestBody(required = false) ConversationRequest conversationRequest,
            @RequestParam(required = false) String model) {
        return createConversationInternal(conversationRequest, model);
    }

    @PostMapping("/answer-analysis/create-conversation")
    public ConversationResponse createAnswerAnalysisConversation(
            @RequestBody(required = false) ConversationRequest conversationRequest,
            @RequestParam(required = false) String model) {
        if (conversationRequest == null) {
            conversationRequest = new ConversationRequest();
        }
        if (!StringUtils.hasText(conversationRequest.getTitle())) {
            conversationRequest.setTitle("题目AI解析");
        }
        return createConversationInternal(conversationRequest, model);
    }

    /**
     * 关闭对话并清理缓存
     */
    @PostMapping("/close-conversation")
    public void closeConversation(@RequestParam String conversationId) {
        conversationCacheService.closeConversation(conversationId);
    }

    @PostMapping("/answer-analysis/close-conversation")
    public void closeAnswerAnalysisConversation(@RequestParam String conversationId) {
        conversationCacheService.closeConversation(conversationId);
    }

    /**
     * 创建聊天流 - 使用GET请求和缓存的消息历史
     *
     * @param content        用户输入的消息内容
     * @param model          使用的AI模型
     * @param conversationId 对话ID
     * @return 聊天响应流
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<StreamResponseEvent> createChatStream(
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "model", required = false) String model,
            @RequestParam(value = "conversation_id", required = false) String conversationId) {
        return createChatStreamInternal(content, model, conversationId, null, true);
    }

    @GetMapping(value = "/answer-analysis/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<StreamResponseEvent> createAnswerAnalysisStream(
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "model", required = false) String model,
            @RequestParam(value = "conversation_id", required = false) String conversationId) {
        if (!StringUtils.hasText(content)) {
            return Flux.just(new StreamResponseEvent(EventTypeEnum.error, "题目内容不能为空"));
        }
        return createChatStreamInternal(content, model, conversationId, ANSWER_ANALYSIS_SYSTEM_PROMPT, false);
    }

    private ConversationResponse createConversationInternal(ConversationRequest conversationRequest, String model) {
        ConversationResponse response = chatService.createConversation(conversationRequest, model);
        conversationCacheService.createConversation(response.getId());
        return response;
    }

    private Flux<StreamResponseEvent> createChatStreamInternal(String content, String model, String conversationId,
            String systemPrompt, boolean allowDefaultContent) {
        ChatRequest chatRequest = buildChatRequest(content, model, conversationId, systemPrompt, allowDefaultContent);
        return chatService.createChatStream(chatRequest, conversationId, model).doOnNext(event -> {
            if (event.getEventType().name().equals("done") && conversationId != null) {
                // 预留扩展：如有需要可在这里缓存 AI 响应
            }
        });
    }

    private ChatRequest buildChatRequest(String content, String model, String conversationId, String systemPrompt,
            boolean allowDefaultContent) {
        ChatRequest chatRequest = new ChatRequest();
        chatRequest.setConversationId(conversationId);
        chatRequest.setModel(model);
        chatRequest.setSystemPrompt(systemPrompt);

        String trimmedContent = StringUtils.hasText(content) ? content.trim() : null;
        if (trimmedContent != null && conversationId != null) {
            ChatRequest.EnterMessage userMessage = new ChatRequest.EnterMessage();
            userMessage.setRole("user");
            userMessage.setContent(trimmedContent);
            conversationCacheService.addMessage(conversationId, userMessage);
        }

        List<ChatRequest.EnterMessage> cachedMessages = conversationId != null
                ? conversationCacheService.getMessages(conversationId)
                : new ArrayList<>();
        if (cachedMessages.isEmpty() && trimmedContent != null) {
            ChatRequest.EnterMessage defaultMessage = new ChatRequest.EnterMessage();
            defaultMessage.setRole("user");
            defaultMessage.setContent(trimmedContent);
            cachedMessages = new ArrayList<>();
            cachedMessages.add(defaultMessage);
        }
        chatRequest.setAdditionalMessages(cachedMessages);

        if (allowDefaultContent
                && (chatRequest.getAdditionalMessages() == null || chatRequest.getAdditionalMessages().isEmpty())) {
            List<ChatRequest.EnterMessage> messages = new ArrayList<>();
            ChatRequest.EnterMessage defaultMessage = new ChatRequest.EnterMessage();
            defaultMessage.setRole("user");
            defaultMessage.setContent("请生成一个问卷");
            messages.add(defaultMessage);
            chatRequest.setAdditionalMessages(messages);
        }
        return chatRequest;
    }
}
