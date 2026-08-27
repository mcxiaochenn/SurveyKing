package cn.surveyking.server.core.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SpaIndexControllerTest {

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(
				new SpaIndexController(new ClassPathResource("static/index.html")), new ApiProbeController()).build();
	}

	@Test
	void rootReturnsHtml() throws Exception {
		assertSpaIndex("/");
	}

	@Test
	void surveySettingRouteReturnsHtml() throws Exception {
		assertSpaIndex("/survey/TJkD0v/setting?mode=exam");
	}

	@Test
	void publicSurveyRouteReturnsHtml() throws Exception {
		assertSpaIndex("/s/TJkD0v");
	}

	@Test
	void apiRouteIsNotHandledBySpaFallback() throws Exception {
		mockMvc.perform(get("/api/system"))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(content().string("api"));
	}

	@Test
	void unknownStaticAndNonSpaRoutesRemainNotFound() throws Exception {
		mockMvc.perform(get("/missing.js")).andExpect(status().isNotFound());
		mockMvc.perform(get("/unknown-route")).andExpect(status().isNotFound());
	}

	private void assertSpaIndex(String path) throws Exception {
		mockMvc.perform(get(path))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
				.andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
				.andExpect(content().string(containsString("<title>SurveyKing</title>")));
	}

	@RestController
	static class ApiProbeController {

		@GetMapping("/api/system")
		Map<String, String> system() {
			return Collections.singletonMap("source", "api");
		}
	}
}
