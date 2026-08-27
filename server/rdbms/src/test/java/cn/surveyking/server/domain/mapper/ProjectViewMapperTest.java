package cn.surveyking.server.domain.mapper;

import cn.surveyking.server.domain.dto.ProjectRequest;
import cn.surveyking.server.domain.dto.ProjectSetting;
import cn.surveyking.server.domain.dto.ProjectView;
import cn.surveyking.server.domain.dto.PublicProjectView;
import cn.surveyking.server.domain.dto.SurveySchema;
import cn.surveyking.server.domain.model.Project;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProjectViewMapperTest {

    private final ProjectViewMapper mapper = new ProjectViewMapper() {
        @Override public Project fromRequest(ProjectRequest request) { return null; }
        @Override public List<Project> fromRequest(List<ProjectRequest> request) { return null; }
        @Override public ProjectView toView(Project model) { return null; }
        @Override public List<ProjectView> toView(List<Project> modelList) { return null; }
        @Override public PublicProjectView toPublicProjectView(ProjectView project) { return null; }
    };

    @Test
    void ordinaryExamDoesNotExposeAnswerInfo() {
        ProjectView source = source(false, false);
        assertFalse(mapper.shouldExposeExamAnswer(source));
        assertTrimmedAfterMapping(source);
    }

    @Test
    void exerciseAndMockExamExposeAnswerInfo() {
        assertTrue(mapper.shouldExposeExamAnswer(source(true, false)));
        assertTrue(mapper.shouldExposeExamAnswer(source(false, true)));
    }

    private void assertTrimmedAfterMapping(ProjectView source) {
        PublicProjectView view = new PublicProjectView();
        view.setSurvey(source.getSurvey());
        mapper.calledWithSourceAndTargetType(source, view);
        assertFalse(view.getSurvey().getAttribute().getExamScore() != null);
        assertFalse(view.getSurvey().getAttribute().getExamCorrectAnswer() != null);
    }

    private static ProjectView source(boolean exercise, boolean mock) {
        SurveySchema.Attribute attribute = new SurveySchema.Attribute();
        attribute.setExamScore(1D);
        attribute.setExamCorrectAnswer("A");
        SurveySchema schema = SurveySchema.builder().id("q1").type(SurveySchema.QuestionType.Radio)
                .attribute(attribute).children(Collections.emptyList()).build();
        ProjectSetting.ExamSetting exam = new ProjectSetting.ExamSetting();
        exam.setExerciseMode(exercise);
        exam.setMockExamMode(mock);
        ProjectSetting setting = new ProjectSetting();
        setting.setExamSetting(exam);
        ProjectView source = new ProjectView();
        source.setMode(cn.surveyking.server.core.constant.ProjectModeEnum.exam);
        source.setSetting(setting);
        source.setSurvey(schema);
        return source;
    }
}
