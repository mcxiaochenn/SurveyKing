package cn.surveyking.server.core.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * @author javahuang
 * @date 2021/8/11
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

	private final ObjectMapper objectMapper;

	@Override
	public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
		// 允许 controller 直接返回 string
		converters.add(0, new MappingJackson2HttpMessageConverter(objectMapper));
	}

	// 匹配类型的静态资源都会被 ResourceHandler 来处理
	public static final String[] STATIC_RESOURCES = { "/**/*.css", "/**/*.js", "/**/*.jpg", "/**/*.png", "/**/*.svg", // 图片
			"/**/*.eot", "/**/*.ttf", "/**/*.woff", "/**/favicon.ico" };

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.setOrder(-1) // 设置静态资源映射优先级高于前端路由控制器
				.addResourceHandler(STATIC_RESOURCES).addResourceLocations("classpath:/static/")
				.setCachePeriod(3600 * 24);
	}

}
