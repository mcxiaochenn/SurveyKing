package cn.surveyking.server.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * 前端路由入口。直接写入 HTML，避免被 JSON 消息转换器序列化。
 */
@Controller
public class SpaIndexController {

	private final Resource indexHtml;

	public SpaIndexController(@Value("classpath:/static/index.html") Resource indexHtml) {
		this.indexHtml = indexHtml;
	}

	@GetMapping({ "/", "/account", "/account/**", "/exercise", "/exercise/**", "/home", "/project", "/project/**",
			"/repo", "/repo/**", "/s/**", "/survey", "/survey/**", "/system", "/system/**", "/t/**",
			"/template", "/user", "/user/**" })
	public void index(HttpServletResponse response) throws IOException {
		response.setContentType(MediaType.TEXT_HTML_VALUE);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
		try (InputStream inputStream = indexHtml.getInputStream()) {
			StreamUtils.copy(inputStream, response.getOutputStream());
		}
	}
}
