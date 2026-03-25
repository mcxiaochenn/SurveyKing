package cn.surveyking.server.domain.dto;

import lombok.Data;

import java.util.List;

@Data
public class RepoPartnerRequest {

	private List<String> ids;

	private String repoId;

	private List<String> userIds;
}
