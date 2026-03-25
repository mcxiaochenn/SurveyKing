package cn.surveyking.server.domain.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class RepoPartnerQuery extends PageQuery {

	private String repoId;

	private String userName;
}
