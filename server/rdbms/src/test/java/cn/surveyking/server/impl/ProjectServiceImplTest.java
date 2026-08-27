package cn.surveyking.server.impl;

import cn.surveyking.server.domain.dto.ProjectSetting;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import javax.validation.ValidationException;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProjectServiceImplTest {

    @Test
    void enablingMockExamDisablesPracticeAndWrongPractice() {
        ProjectSetting setting = setting(false, true, true);

        ProjectServiceImpl.normalizeExamModes(setting, "examSetting.mockExamMode");

        assertTrue(setting.getExamSetting().getMockExamMode());
        assertFalse(setting.getExamSetting().getExerciseMode());
        assertFalse(setting.getExamSetting().getRandomSurveyWrong());
    }

    @Test
    void enablingPracticeDisablesMockExam() {
        ProjectSetting setting = setting(true, false, false);

        ProjectServiceImpl.normalizeExamModes(setting, "examSetting.exerciseMode");

        assertFalse(setting.getExamSetting().getMockExamMode());
        assertTrue(setting.getExamSetting().getExerciseMode());
    }

    @Test
    void enablingWrongPracticeKeepsPracticeAndDisablesMockExam() {
        ProjectSetting setting = setting(true, false, false);

        ProjectServiceImpl.normalizeExamModes(setting, "examSetting.randomSurveyWrong");

        assertFalse(setting.getExamSetting().getMockExamMode());
        assertTrue(setting.getExamSetting().getExerciseMode());
        assertTrue(setting.getExamSetting().getRandomSurveyWrong());
    }

    @Test
    void fullSettingWithBothModesEnabledIsRejected() {
        ProjectSetting setting = setting(true, true, false);

        assertThrows(ValidationException.class, () -> ProjectServiceImpl.normalizeExamModes(setting, null));
    }

    @Test
    void historicalSettingWithoutMockExamFieldRemainsValid() {
        ProjectSetting setting = new ProjectSetting();
        setting.getExamSetting().setExerciseMode(true);

        ProjectServiceImpl.normalizeExamModes(setting, null);

        assertTrue(setting.getExamSetting().getExerciseMode());
    }

    @Test
    void historicalJsonWithoutMockExamFieldDeserializes() throws Exception {
        ProjectSetting setting = new ObjectMapper().readValue(
                "{\"examSetting\":{\"exerciseMode\":true}}", ProjectSetting.class);

        assertTrue(setting.getExamSetting().getExerciseMode());
        assertFalse(Boolean.TRUE.equals(setting.getExamSetting().getMockExamMode()));
    }

    private static ProjectSetting setting(boolean exerciseMode, boolean mockExamMode, boolean randomSurveyWrong) {
        ProjectSetting setting = new ProjectSetting();
        ProjectSetting.ExamSetting examSetting = new ProjectSetting.ExamSetting();
        examSetting.setExerciseMode(exerciseMode);
        examSetting.setMockExamMode(mockExamMode);
        examSetting.setRandomSurveyWrong(randomSurveyWrong);
        setting.setExamSetting(examSetting);
        return setting;
    }
}
